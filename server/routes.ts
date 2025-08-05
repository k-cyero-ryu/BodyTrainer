import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertTrainerSchema, insertClientSchema, insertTrainingPlanSchema, insertExerciseSchema, insertPostSchema, insertChatMessageSchema, insertMonthlyEvaluationSchema, type User } from "@shared/schema";

// Extend WebSocket type to include userId
interface ExtendedWebSocket extends WebSocket {
  userId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get additional user data based on role
      let additionalData = {};
      if (user.role === 'trainer') {
        const trainer = await storage.getTrainerByUserId(userId);
        if (trainer) {
          additionalData = { trainer };
        }
      } else if (user.role === 'client') {
        const client = await storage.getClientByUserId(userId);
        if (client) {
          additionalData = { client };
        }
      }
      
      res.json({ ...user, ...additionalData });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Role selection endpoint
  app.post('/api/users/select-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role, trainerData, referralCode } = req.body;

      if (!['trainer', 'client'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'trainer' or 'client'" });
      }

      // Update user role
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user role and status
      const updatedUser = await storage.upsertUser({
        ...user,
        role: role,
        status: role === 'trainer' ? 'pending' : 'active', // Trainers need approval
      });

      // Create role-specific records
      if (role === 'trainer') {
        // Generate unique referral code
        const referralCodeValue = `TR${Date.now().toString().slice(-6)}${userId.slice(-2)}`;
        
        await storage.createTrainer({
          userId: userId,
          referralCode: referralCodeValue,
          expertise: trainerData?.expertise || '',
          experience: trainerData?.experience || '',
        });
      } else if (role === 'client') {
        // Find trainer by referral code if provided
        let trainerId = null;
        if (referralCode) {
          const trainer = await storage.getTrainerByReferralCode(referralCode);
          if (trainer) {
            trainerId = trainer.id;
          }
        }

        if (trainerId) {
          await storage.createClient({
            userId: userId,
            trainerId: trainerId,
          });
        }
        // If no referral code or trainer not found, client will be created without a trainer
      }

      res.json({ 
        success: true, 
        user: updatedUser,
        message: role === 'trainer' 
          ? 'Trainer profile created! Your account is pending approval.' 
          : 'Client profile created successfully!'
      });

    } catch (error) {
      console.error("Error selecting role:", error);
      res.status(500).json({ message: "Failed to select role" });
    }
  });

  // Superadmin management endpoint
  app.post('/api/admin/promote-superadmin', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const currentUser = await storage.getUser(currentUserId);
      
      // Only existing superadmins can promote others
      if (!currentUser || currentUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Only superadmins can promote users" });
      }

      const { userEmail } = req.body;
      if (!userEmail) {
        return res.status(400).json({ message: "User email is required" });
      }

      // Find user by email and promote to superadmin
      const targetUser = await storage.getUserByEmail(userEmail);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...targetUser,
        role: 'superadmin',
        status: 'active',
      });

      res.json({ 
        success: true, 
        user: updatedUser,
        message: 'User promoted to superadmin successfully!'
      });

    } catch (error) {
      console.error("Error promoting user to superadmin:", error);
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  // Initial superadmin setup endpoint (for bootstrapping)
  app.post('/api/admin/setup-superadmin', async (req, res) => {
    try {
      const { email, setupKey } = req.body;
      
      // Check setup key (use environment variable for security)
      const expectedSetupKey = process.env.SUPERADMIN_SETUP_KEY || 'replit-fitness-admin-2025';
      if (setupKey !== expectedSetupKey) {
        return res.status(403).json({ message: "Invalid setup key" });
      }

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if any superadmin already exists - allow setup if no SuperAdmins exist
      try {
        const existingSuperAdmins = await storage.getUsersByRole('superadmin');
        if (existingSuperAdmins.length > 0) {
          // If there are existing superadmins, use the promote endpoint instead
          return res.status(403).json({ message: "SuperAdmin already exists. Use the promote endpoint instead." });
        }
      } catch (error) {
        console.log("Error checking existing superadmins:", error);
        // If error checking, allow setup to proceed
      }

      // Find user by email
      const targetUser = await storage.getUserByEmail(email);
      if (!targetUser) {
        return res.status(404).json({ 
          message: "User not found. Please ensure the user has logged in at least once." 
        });
      }

      // Promote to superadmin
      const updatedUser = await storage.upsertUser({
        ...targetUser,
        role: 'superadmin',
        status: 'active',
      });

      res.json({ 
        success: true, 
        user: updatedUser,
        message: 'SuperAdmin account created successfully!'
      });

    } catch (error) {
      console.error("Error setting up superadmin:", error);
      res.status(500).json({ message: "Failed to setup superadmin" });
    }
  });

  // Object storage routes for exercise media
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Trainer routes
  app.post('/api/trainers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trainerData = insertTrainerSchema.parse(req.body);
      
      // Generate unique referral code
      const referralCode = `TRAINER${Date.now()}`;
      
      const trainer = await storage.createTrainer({
        ...trainerData,
        userId,
        referralCode,
      });
      
      res.status(201).json(trainer);
    } catch (error) {
      console.error("Error creating trainer:", error);
      res.status(500).json({ message: "Failed to create trainer" });
    }
  });

  app.get('/api/trainers/:id', isAuthenticated, async (req, res) => {
    try {
      const trainer = await storage.getTrainer(req.params.id);
      if (!trainer) {
        return res.status(404).json({ message: "Trainer not found" });
      }
      res.json(trainer);
    } catch (error) {
      console.error("Error fetching trainer:", error);
      res.status(500).json({ message: "Failed to fetch trainer" });
    }
  });

  app.get('/api/trainers/:id/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getTrainerStats(req.params.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching trainer stats:", error);
      res.status(500).json({ message: "Failed to fetch trainer stats" });
    }
  });

  app.get('/api/trainers/:id/clients', isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClientsByTrainer(req.params.id);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching trainer clients:", error);
      res.status(500).json({ message: "Failed to fetch trainer clients" });
    }
  });

  // Client registration with referral code
  app.post('/api/clients/register', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { referralCode, ...clientData } = req.body;
      
      // Find trainer by referral code
      const trainer = await storage.getTrainerByReferralCode(referralCode);
      if (!trainer) {
        return res.status(400).json({ message: "Invalid referral code" });
      }
      
      const client = await storage.createClient({
        ...insertClientSchema.parse(clientData),
        userId,
        trainerId: trainer.id,
        referralSource: referralCode,
      });
      
      res.status(201).json(client);
    } catch (error) {
      console.error("Error registering client:", error);
      res.status(500).json({ message: "Failed to register client" });
    }
  });

  // Training plan routes
  app.post('/api/training-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trainer = await storage.getTrainerByUserId(userId);
      if (!trainer) {
        return res.status(403).json({ message: "Only trainers can create plans" });
      }
      
      const planData = insertTrainingPlanSchema.parse(req.body);
      const plan = await storage.createTrainingPlan({
        ...planData,
        trainerId: trainer.id,
      });
      
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating training plan:", error);
      res.status(500).json({ message: "Failed to create training plan" });
    }
  });

  app.get('/api/training-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trainer = await storage.getTrainerByUserId(userId);
      if (!trainer) {
        return res.status(403).json({ message: "Only trainers can view plans" });
      }
      
      const plans = await storage.getTrainingPlansByTrainer(trainer.id);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching training plans:", error);
      res.status(500).json({ message: "Failed to fetch training plans" });
    }
  });

  // Exercise routes
  app.post('/api/exercises', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trainer = await storage.getTrainerByUserId(userId);
      if (!trainer) {
        return res.status(403).json({ message: "Only trainers can create exercises" });
      }
      
      const exerciseData = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise({
        ...exerciseData,
        trainerId: trainer.id,
      });
      
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      res.status(500).json({ message: "Failed to create exercise" });
    }
  });

  app.get('/api/exercises', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trainer = await storage.getTrainerByUserId(userId);
      if (!trainer) {
        return res.status(403).json({ message: "Only trainers can view exercises" });
      }
      
      const exercises = await storage.getExercisesByTrainer(trainer.id);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.put('/api/exercises/:id/media', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!req.body.mediaURL) {
        return res.status(400).json({ error: "mediaURL is required" });
      }

      const trainer = await storage.getTrainerByUserId(userId);
      if (!trainer) {
        return res.status(403).json({ message: "Only trainers can update exercises" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.mediaURL,
        {
          owner: userId,
          visibility: "public", // Exercise media should be publicly accessible
        },
      );

      await storage.updateExercise(req.params.id, {
        mediaUrl: objectPath,
        mediaType: req.body.mediaType || 'image',
      });

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error updating exercise media:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Monthly evaluation routes
  app.post('/api/evaluations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const client = await storage.getClientByUserId(userId);
      if (!client) {
        return res.status(403).json({ message: "Only clients can submit evaluations" });
      }
      
      const evaluationData = insertMonthlyEvaluationSchema.parse(req.body);
      const evaluation = await storage.createMonthlyEvaluation({
        ...evaluationData,
        clientId: client.id,
      });
      
      res.status(201).json(evaluation);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      res.status(500).json({ message: "Failed to create evaluation" });
    }
  });

  app.get('/api/evaluations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const client = await storage.getClientByUserId(userId);
      if (!client) {
        return res.status(403).json({ message: "Only clients can view evaluations" });
      }
      
      const evaluations = await storage.getMonthlyEvaluationsByClient(client.id);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({ message: "Failed to fetch evaluations" });
    }
  });

  // Chat routes
  app.get('/api/chat/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const currentUser = await storage.getUser(currentUserId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all users and filter based on role
      const allUsers = await storage.getAllUsers();
      
      const chatUsers = allUsers
        .filter((user: User) => user.id !== currentUserId) // Exclude current user
        .map((user: User) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
        }));
      
      res.json(chatUsers);
    } catch (error) {
      console.error("Error fetching chat users:", error);
      res.status(500).json({ message: "Failed to fetch chat users" });
    }
  });

  app.get('/api/chat/messages/:receiverId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getChatMessages(userId, req.params.receiverId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });
      
      const message = await storage.createChatMessage(messageData);
      
      // Broadcast to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'new_message',
            data: message,
          }));
        }
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'superadmin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/pending-trainers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'superadmin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const trainers = await storage.getPendingTrainers();
      res.json(trainers);
    } catch (error) {
      console.error("Error fetching pending trainers:", error);
      res.status(500).json({ message: "Failed to fetch pending trainers" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_room') {
          // Handle user joining chat room
          ws.userId = data.userId;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
