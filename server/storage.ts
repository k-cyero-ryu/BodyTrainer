import {
  users,
  trainers,
  clients,
  trainingPlans,
  exercises,
  planExercises,
  clientPlans,
  workoutLogs,
  monthlyEvaluations,
  posts,
  chatMessages,
  communityGroups,
  communityMembers,
  communityMessages,
  socialPosts,
  socialLikes,
  socialComments,
  paymentPlans,
  clientPaymentPlans,
  foodEntries,
  cardioActivities,
  customCalorieEntries,
  usdaFoodsCache,
  mealPlans,
  mealPlanAssignments,
  mealDays,
  meals,
  mealItems,
  supplementPlans,
  supplementItems,
  supplementPlanItems,
  supplementPlanAssignments,
  systemSettings,
  type User,
  type UpsertUser,
  type Trainer,
  type InsertTrainer,
  type Client,
  type InsertClient,
  type TrainingPlan,
  type InsertTrainingPlan,
  type Exercise,
  type InsertExercise,
  type PlanExercise,
  type InsertPlanExercise,
  type ClientPlan,
  type InsertClientPlan,
  type WorkoutLog,
  type InsertWorkoutLog,
  type MonthlyEvaluation,
  type InsertMonthlyEvaluation,
  type Post,
  type InsertPost,
  type ChatMessage,
  type InsertChatMessage,
  type CommunityGroup,
  type InsertCommunityGroup,
  type CommunityMember,
  type InsertCommunityMember,
  type CommunityMessage,
  type InsertCommunityMessage,
  type PaymentPlan,
  type InsertPaymentPlan,
  type ClientPaymentPlan,
  type InsertClientPaymentPlan,
  type SocialPost,
  type SocialLike,
  type SocialComment,
  type InsertSocialPost,
  type InsertSocialLike,
  type InsertSocialComment,
  type FoodEntry,
  type InsertFoodEntry,
  type UpdateFoodEntry,
  type CardioActivity,
  type InsertCardioActivity,
  type UpdateCardioActivity,
  type CustomCalorieEntry,
  type InsertCustomCalorieEntry,
  type UpdateCustomCalorieEntry,
  type UsdaFoodCache,
  type InsertUsdaFoodCache,
  type MealPlan,
  type InsertMealPlan,
  type MealPlanAssignment,
  type InsertMealPlanAssignment,
  type MealDay,
  type InsertMealDay,
  type Meal,
  type InsertMeal,
  type MealItem,
  type InsertMealItem,
  type SupplementPlan,
  type InsertSupplementPlan,
  type SupplementItem,
  type InsertSupplementItem,
  type SupplementPlanItem,
  type InsertSupplementPlanItem,
  type SupplementPlanAssignment,
  type InsertSupplementPlanAssignment,
  type SystemSetting,
  type InsertSystemSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sum, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (for username/password authentication)
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmailOrUsername(email: string, username: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  resetUserPassword(userId: string, newPassword: string): Promise<void>;

  // Trainer operations
  createTrainer(trainer: InsertTrainer): Promise<Trainer>;
  getTrainer(id: string): Promise<Trainer | undefined>;
  getTrainerByUserId(userId: string): Promise<Trainer | undefined>;
  getTrainerByReferralCode(code: string): Promise<Trainer | undefined>;
  updateTrainer(id: string, trainer: Partial<InsertTrainer>): Promise<Trainer>;
  getAllTrainers(): Promise<Trainer[]>;
  getPendingTrainers(): Promise<Trainer[]>;
  getApprovedTrainers(): Promise<Trainer[]>;
  approveTrainer(trainerId: string): Promise<void>;
  rejectTrainer(trainerId: string): Promise<void>;
  suspendTrainer(trainerId: string): Promise<void>;

  // Client operations
  createClient(client: InsertClient): Promise<Client>;
  getClient(id: string): Promise<Client | undefined>;
  getClientById(clientId: string): Promise<Client | undefined>;
  getClientByUserId(userId: string): Promise<Client | undefined>;
  getClientsByTrainer(trainerId: string): Promise<Client[]>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  suspendClient(clientId: string): Promise<void>;
  reactivateClient(clientId: string): Promise<void>;

  // Training plan operations
  createTrainingPlan(plan: InsertTrainingPlan): Promise<TrainingPlan>;
  getTrainingPlan(id: string): Promise<TrainingPlan | undefined>;
  getTrainingPlansByTrainer(trainerId: string): Promise<TrainingPlan[]>;
  updateTrainingPlan(id: string, plan: Partial<InsertTrainingPlan>): Promise<TrainingPlan>;
  deleteTrainingPlan(id: string): Promise<void>;

  // Exercise operations
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getExercise(id: string): Promise<Exercise | undefined>;
  getExercisesByTrainer(trainerId: string): Promise<Exercise[]>;
  updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise>;
  deleteExercise(id: string): Promise<void>;

  // Plan exercise operations
  createPlanExercise(planExercise: InsertPlanExercise): Promise<PlanExercise>;
  createPlanExercises(planId: string, exercises: Array<Omit<InsertPlanExercise, 'planId'>>): Promise<void>;
  getPlanExercise(id: string): Promise<PlanExercise | undefined>;
  getPlanExercisesByPlan(planId: string): Promise<PlanExercise[]>;
  updatePlanExercise(id: string, planExercise: Partial<InsertPlanExercise>): Promise<PlanExercise>;
  deletePlanExercise(id: string): Promise<void>;

  // Client plan operations
  assignPlanToClient(clientPlan: InsertClientPlan): Promise<ClientPlan>;
  replaceClientPlanAssignment(clientPlan: InsertClientPlan): Promise<ClientPlan>;
  getClientPlans(clientId: string): Promise<ClientPlan[]>;
  getActiveClientPlan(clientId: string): Promise<ClientPlan | undefined>;
  updateClientPlan(id: string, updates: Partial<InsertClientPlan>): Promise<ClientPlan>;

  // Workout log operations
  createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  getWorkoutLogsByClient(clientId: string): Promise<WorkoutLog[]>;
  getWorkoutLogsByDateRange(clientId: string, startDate: Date, endDate: Date): Promise<WorkoutLog[]>;
  deleteWorkoutLog(id: string): Promise<void>;

  // Food entry operations
  createFoodEntry(entry: InsertFoodEntry): Promise<FoodEntry>;
  getFoodEntryById(entryId: string): Promise<FoodEntry | undefined>;
  getFoodEntriesByClient(clientId: string): Promise<FoodEntry[]>;
  getFoodEntriesByDate(clientId: string, date: Date): Promise<FoodEntry[]>;
  getFoodEntriesByDateRange(clientId: string, startDate: Date, endDate: Date): Promise<FoodEntry[]>;
  updateFoodEntry(id: string, entry: Partial<UpdateFoodEntry>): Promise<FoodEntry>;
  deleteFoodEntry(id: string): Promise<void>;

  // Cardio activity operations
  createCardioActivity(activity: InsertCardioActivity): Promise<CardioActivity>;
  getCardioActivityById(activityId: string): Promise<CardioActivity | undefined>;
  getCardioActivitiesByClient(clientId: string): Promise<CardioActivity[]>;
  getCardioActivitiesByDate(clientId: string, date: Date): Promise<CardioActivity[]>;
  getCardioActivitiesByDateRange(clientId: string, startDate: Date, endDate: Date): Promise<CardioActivity[]>;
  updateCardioActivity(id: string, activity: Partial<UpdateCardioActivity>): Promise<CardioActivity>;
  deleteCardioActivity(id: string): Promise<void>;

  // Custom calorie entry operations
  createCustomCalorieEntry(entry: InsertCustomCalorieEntry): Promise<CustomCalorieEntry>;
  getCustomCalorieEntryById(entryId: string): Promise<CustomCalorieEntry | undefined>;
  getCustomCalorieEntriesByClient(clientId: string): Promise<CustomCalorieEntry[]>;
  getCustomCalorieEntriesByDate(clientId: string, date: Date): Promise<CustomCalorieEntry[]>;
  updateCustomCalorieEntry(id: string, entry: Partial<UpdateCustomCalorieEntry>): Promise<CustomCalorieEntry>;
  deleteCustomCalorieEntry(id: string): Promise<void>;
  
  // Calorie tracking operations
  getCalorieSummaryByDate(clientId: string, date: Date): Promise<{
    goal: number;
    total: number;
    remaining: number;
    breakdown: {
      foodEntries: number;
      customEntries: number;
    };
    items: Array<{
      type: 'food' | 'custom';
      id: string;
      description: string;
      calories: number;
      mealType?: string;
      isIncludedInCalories?: boolean;
    }>;
  }>;
  getCalorieGoal(clientId: string): Promise<number>;
  setCalorieGoal(clientId: string, goal: number): Promise<void>;

  // USDA Food Cache operations
  cacheUsdaFood(food: InsertUsdaFoodCache): Promise<UsdaFoodCache>;
  getUsdaFoodByFdcId(fdcId: string): Promise<UsdaFoodCache | undefined>;
  updateUsdaFoodLastUsed(fdcId: string): Promise<void>;

  // Meal Plan Template operations (templates can be assigned to multiple clients)
  createMealPlan(plan: InsertMealPlan): Promise<MealPlan>;
  getMealPlan(id: string): Promise<MealPlan | undefined>;
  getMealPlansByTrainer(trainerId: string): Promise<MealPlan[]>;
  updateMealPlan(id: string, plan: Partial<InsertMealPlan>): Promise<MealPlan>;
  deleteMealPlan(id: string): Promise<void>;

  // Meal Plan Assignment operations (links templates to clients)
  createMealPlanAssignment(assignment: InsertMealPlanAssignment): Promise<MealPlanAssignment>;
  replaceMealPlanAssignment(assignment: InsertMealPlanAssignment): Promise<MealPlanAssignment>;
  getMealPlanAssignment(id: string): Promise<MealPlanAssignment | undefined>;
  getMealPlanAssignmentsByClient(clientId: string): Promise<MealPlanAssignment[]>;
  getMealPlanAssignmentsByPlan(planId: string): Promise<MealPlanAssignment[]>;
  getActiveMealPlanAssignment(clientId: string): Promise<MealPlanAssignment | undefined>;
  updateMealPlanAssignment(id: string, assignment: Partial<InsertMealPlanAssignment>): Promise<MealPlanAssignment>;
  deleteMealPlanAssignment(id: string): Promise<void>;

  // Meal Day operations
  createMealDay(day: InsertMealDay): Promise<MealDay>;
  getMealDaysByPlan(planId: string): Promise<MealDay[]>;
  updateMealDay(id: string, day: Partial<InsertMealDay>): Promise<MealDay>;
  deleteMealDay(id: string): Promise<void>;

  // Meal operations
  createMeal(meal: InsertMeal): Promise<Meal>;
  getMealsByDay(dayId: string): Promise<Meal[]>;
  updateMeal(id: string, meal: Partial<InsertMeal>): Promise<Meal>;
  deleteMeal(id: string): Promise<void>;

  // Meal Item operations
  createMealItem(item: InsertMealItem): Promise<MealItem>;
  getMealItemsByMeal(mealId: string): Promise<MealItem[]>;
  updateMealItem(id: string, item: Partial<InsertMealItem>): Promise<MealItem>;
  deleteMealItem(id: string): Promise<void>;

  // Supplement Item Library operations (trainer-owned reusable items)
  createSupplementItem(item: InsertSupplementItem): Promise<SupplementItem>;
  getSupplementItem(id: string): Promise<SupplementItem | undefined>;
  getSupplementItemsByTrainer(trainerId: string): Promise<SupplementItem[]>;
  updateSupplementItem(id: string, item: Partial<InsertSupplementItem>): Promise<SupplementItem>;
  deleteSupplementItem(id: string): Promise<void>;

  // Supplement Plan Template operations (templates can be assigned to multiple clients)
  createSupplementPlan(plan: InsertSupplementPlan): Promise<SupplementPlan>;
  getSupplementPlan(id: string): Promise<SupplementPlan | undefined>;
  getSupplementPlansByTrainer(trainerId: string): Promise<SupplementPlan[]>;
  updateSupplementPlan(id: string, plan: Partial<InsertSupplementPlan>): Promise<SupplementPlan>;
  deleteSupplementPlan(id: string): Promise<void>;

  // Supplement Plan Item operations (junction table)
  createSupplementPlanItem(item: InsertSupplementPlanItem): Promise<SupplementPlanItem>;
  getSupplementPlanItemsByPlan(planId: string): Promise<SupplementPlanItem[]>;
  updateSupplementPlanItem(id: string, item: Partial<InsertSupplementPlanItem>): Promise<SupplementPlanItem>;
  deleteSupplementPlanItem(id: string): Promise<void>;

  // Supplement Plan Assignment operations (links templates to clients)
  createSupplementPlanAssignment(assignment: InsertSupplementPlanAssignment): Promise<SupplementPlanAssignment>;
  replaceSupplementPlanAssignment(assignment: InsertSupplementPlanAssignment): Promise<SupplementPlanAssignment>;
  getSupplementPlanAssignment(id: string): Promise<SupplementPlanAssignment | undefined>;
  getSupplementPlanAssignmentsByClient(clientId: string): Promise<SupplementPlanAssignment[]>;
  getSupplementPlanAssignmentsByPlan(planId: string): Promise<SupplementPlanAssignment[]>;
  getActiveSupplementPlanAssignment(clientId: string): Promise<SupplementPlanAssignment | undefined>;
  updateSupplementPlanAssignment(id: string, assignment: Partial<InsertSupplementPlanAssignment>): Promise<SupplementPlanAssignment>;
  deleteSupplementPlanAssignment(id: string): Promise<void>;

  // Monthly evaluation operations
  createMonthlyEvaluation(evaluation: InsertMonthlyEvaluation): Promise<MonthlyEvaluation>;
  getMonthlyEvaluation(id: string): Promise<MonthlyEvaluation | undefined>;
  getMonthlyEvaluationsByClient(clientId: string): Promise<MonthlyEvaluation[]>;

  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPostsByTrainer(trainerId: string): Promise<Post[]>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: string): Promise<void>;

  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]>;
  markMessagesAsRead(receiverId: string, senderId: string): Promise<void>;
  canTrainerChatWithUser(trainerId: string, targetUserId: string): Promise<boolean>;
  
  // Community operations
  createCommunityGroup(group: InsertCommunityGroup): Promise<CommunityGroup>;
  getCommunityGroupByTrainer(trainerId: string): Promise<CommunityGroup | undefined>;
  updateCommunityGroup(id: string, updates: { name?: string; description?: string | null }): Promise<CommunityGroup>;
  addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember>;
  getCommunityMembers(groupId: string): Promise<string[]>;
  isCommunityMember(groupId: string, userId: string): Promise<boolean>;
  createCommunityMessage(message: InsertCommunityMessage): Promise<CommunityMessage>;
  getCommunityMessages(groupId: string): Promise<CommunityMessage[]>;

  // Payment plan operations (SuperAdmin manages trainer payment plans)
  getAllPaymentPlans(): Promise<PaymentPlan[]>;
  getActivePaymentPlans(): Promise<PaymentPlan[]>;
  createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan>;
  updatePaymentPlan(id: string, plan: Partial<InsertPaymentPlan>): Promise<PaymentPlan>;
  deletePaymentPlan(id: string): Promise<void>;

  // Client payment plan operations (Trainers manage client payment plans)
  createClientPaymentPlan(plan: InsertClientPaymentPlan): Promise<ClientPaymentPlan>;
  getClientPaymentPlansByTrainer(trainerId: string): Promise<ClientPaymentPlan[]>;
  getClientPaymentPlan(id: string): Promise<ClientPaymentPlan | undefined>;
  updateClientPaymentPlan(id: string, plan: Partial<InsertClientPaymentPlan>): Promise<ClientPaymentPlan>;
  deleteClientPaymentPlan(id: string): Promise<void>;
  assignClientPaymentPlan(clientId: string, clientPaymentPlanId: string | null): Promise<void>;

  // Analytics operations
  getTrainerStats(trainerId: string): Promise<{
    totalClients: number;
    activeClients: number;
    monthlyRevenue: number;
    totalPlans: number;
  }>;
  getClientStats(clientId: string): Promise<{
    workoutsThisWeek: number;
    currentWeight: number;
    goalProgress: number;
    streak: number;
  }>;
  getSystemStats(): Promise<{
    totalTrainers: number;
    activeTrainers: number;
    totalClients: number;
    monthlyRevenue: number;
  }>;

  // Admin view methods with filtering
  getAllClientsAdmin(filters: { trainer?: string; search?: string; status?: string }): Promise<any[]>;
  getAllTrainingPlansAdmin(filters: { trainer?: string; search?: string }): Promise<any[]>;
  getAllExercisesAdmin(filters: { trainer?: string; search?: string; category?: string }): Promise<any[]>;

  // Trainer management methods
  getTrainersWithDetails(): Promise<any[]>;
  updateTrainerPaymentPlan(trainerId: string, paymentPlanId: string | null): Promise<void>;
  updateTrainerStatus(trainerId: string, status: string): Promise<void>;

  // Social operations
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  getSocialPosts(limit?: number, offset?: number): Promise<any[]>; // Returns posts with author info
  getSocialPost(id: string): Promise<SocialPost | undefined>;
  updateSocialPost(id: string, post: Partial<InsertSocialPost>): Promise<SocialPost>;
  deleteSocialPost(id: string): Promise<void>;
  
  // Social likes operations
  toggleSocialLike(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }>;
  getSocialPostLikes(postId: string): Promise<SocialLike[]>;
  
  // Social comments operations
  createSocialComment(comment: InsertSocialComment): Promise<SocialComment>;
  getSocialPostComments(postId: string): Promise<any[]>; // Returns comments with author info
  updateSocialComment(id: string, comment: Partial<InsertSocialComment>): Promise<SocialComment>;
  deleteSocialComment(id: string): Promise<void>;
  
  // Helper method to check if image belongs to a social post
  isSocialPostImage(imageUrl: string): Promise<boolean>;
  isCommunityFile(fileUrl: string): Promise<{ groupId: string } | null>;

  // System Settings operations
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  upsertSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(key: string, value: boolean, updatedBy?: string): Promise<SystemSetting>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmailOrUsername(email: string, username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`${users.email} = ${email} OR ${users.username} = ${username}`
    );
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Trainer operations
  async createTrainer(trainer: InsertTrainer): Promise<Trainer> {
    const [created] = await db.insert(trainers).values(trainer).returning();
    return created;
  }

  async getTrainer(id: string): Promise<Trainer | undefined> {
    const [trainer] = await db.select().from(trainers).where(eq(trainers.id, id));
    return trainer;
  }

  async getTrainerByUserId(userId: string): Promise<Trainer | undefined> {
    console.log('[DEBUG STORAGE] Looking for trainer with userId:', userId);
    const result = await db.select().from(trainers).where(eq(trainers.userId, userId));
    console.log('[DEBUG STORAGE] Found trainers:', result);
    const [trainer] = result;
    console.log('[DEBUG STORAGE] Returning trainer:', trainer);
    return trainer;
  }

  async getTrainerByReferralCode(code: string): Promise<Trainer | undefined> {
    const [trainer] = await db.select().from(trainers).where(eq(trainers.referralCode, code));
    return trainer;
  }

  async updateTrainer(id: string, trainer: Partial<InsertTrainer>): Promise<Trainer> {
    const [updated] = await db
      .update(trainers)
      .set({ ...trainer, updatedAt: new Date() })
      .where(eq(trainers.id, id))
      .returning();
    return updated;
  }

  async getAllTrainers(): Promise<Trainer[]> {
    return await db.select().from(trainers).orderBy(desc(trainers.createdAt));
  }

  async getPendingTrainers(): Promise<Trainer[]> {
    const result = await db
      .select({
        id: trainers.id,
        userId: trainers.userId,
        referralCode: trainers.referralCode,
        expertise: trainers.expertise,
        experience: trainers.experience,
        gallery: trainers.gallery,
        monthlyRevenue: trainers.monthlyRevenue,
        createdAt: trainers.createdAt,
        updatedAt: trainers.updatedAt,
        // Include user information for display
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        status: users.status,
        role: users.role,
      })
      .from(trainers)
      .innerJoin(users, eq(trainers.userId, users.id))
      .where(eq(users.status, 'pending'))
      .orderBy(desc(trainers.createdAt));
    return result as any[];
  }

  async getApprovedTrainers(): Promise<Trainer[]> {
    const result = await db
      .select({
        id: trainers.id,
        userId: trainers.userId,
        referralCode: trainers.referralCode,
        expertise: trainers.expertise,
        experience: trainers.experience,
        gallery: trainers.gallery,
        monthlyRevenue: trainers.monthlyRevenue,
        createdAt: trainers.createdAt,
        updatedAt: trainers.updatedAt,
        // Include user information for display
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        status: users.status,
        role: users.role,
      })
      .from(trainers)
      .innerJoin(users, eq(trainers.userId, users.id))
      .where(eq(users.status, 'active'))
      .orderBy(desc(trainers.createdAt));
    return result as any[];
  }

  async approveTrainer(trainerId: string): Promise<void> {
    console.log('ApproveTrainer: Looking for trainer with ID:', trainerId);
    
    // Get trainer to find userId
    const trainer = await this.getTrainer(trainerId);
    console.log('ApproveTrainer: Found trainer:', trainer);
    
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    console.log('ApproveTrainer: Updating user status for userId:', trainer.userId);
    
    // Update user status to active
    const result = await db
      .update(users)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(users.id, trainer.userId))
      .returning();
      
    console.log('ApproveTrainer: Update result:', result);
  }

  async rejectTrainer(trainerId: string): Promise<void> {
    // Get trainer to find userId
    const trainer = await this.getTrainer(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    // Delete trainer record and update user status
    await db.delete(trainers).where(eq(trainers.id, trainerId));
    await db
      .update(users)
      .set({ role: 'client', status: 'active', updatedAt: new Date() })
      .where(eq(users.id, trainer.userId));
  }

  async suspendTrainer(trainerId: string): Promise<void> {
    // Get trainer to find userId
    const trainer = await this.getTrainer(trainerId);
    if (!trainer) {
      throw new Error('Trainer not found');
    }

    // Update user status to inactive (suspended)
    await db
      .update(users)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(users.id, trainer.userId));
  }

  // Client operations
  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientByUserId(userId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
    return client;
  }

  async getClientsByTrainer(trainerId: string): Promise<any[]> {
    try {
      const clientResults = await db
        .select()
        .from(clients)
        .innerJoin(users, eq(clients.userId, users.id))
        .where(eq(clients.trainerId, trainerId))
        .orderBy(desc(clients.createdAt));

      return clientResults.map(row => ({
        ...row.clients,
        user: row.users,
      }));
    } catch (error) {
      console.error("Error in getClientsByTrainer:", error);
      return [];
    }
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const [updated] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updated;
  }

  async getClientById(clientId: string): Promise<Client | undefined> {
    try {
      const result = await db
        .select()
        .from(clients)
        .innerJoin(users, eq(clients.userId, users.id))
        .where(eq(clients.id, clientId));

      if (result.length === 0) {
        return undefined;
      }

      return {
        ...result[0].clients,
        user: result[0].users,
      } as any;
    } catch (error) {
      console.error("Error in getClientById:", error);
      return undefined;
    }
  }

  async suspendClient(clientId: string): Promise<void> {
    // Get client to find userId
    const client = await this.getClient(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Update user status to inactive (since suspended is not a valid status)
    await db
      .update(users)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(users.id, client.userId));
  }

  async reactivateClient(clientId: string): Promise<void> {
    // Get client to find userId
    const client = await this.getClient(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Update user status to active
    await db
      .update(users)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(users.id, client.userId));
  }

  // Training plan operations
  async createTrainingPlan(plan: InsertTrainingPlan): Promise<TrainingPlan> {
    const [created] = await db.insert(trainingPlans).values(plan).returning();
    return created;
  }

  async getTrainingPlan(id: string): Promise<TrainingPlan | undefined> {
    const [plan] = await db.select().from(trainingPlans).where(eq(trainingPlans.id, id));
    return plan;
  }

  async getTrainingPlansByTrainer(trainerId: string): Promise<TrainingPlan[]> {
    return await db
      .select()
      .from(trainingPlans)
      .where(eq(trainingPlans.trainerId, trainerId))
      .orderBy(desc(trainingPlans.createdAt));
  }

  async updateTrainingPlan(id: string, plan: Partial<InsertTrainingPlan>): Promise<TrainingPlan> {
    const [updated] = await db
      .update(trainingPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(trainingPlans.id, id))
      .returning();
    return updated;
  }

  async deleteTrainingPlan(id: string): Promise<void> {
    await db.delete(trainingPlans).where(eq(trainingPlans.id, id));
  }

  // Exercise operations
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [created] = await db.insert(exercises).values(exercise).returning();
    return created;
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }

  async getExercisesByTrainer(trainerId: string): Promise<Exercise[]> {
    return await db
      .select()
      .from(exercises)
      .where(eq(exercises.trainerId, trainerId))
      .orderBy(desc(exercises.createdAt));
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise> {
    const [updated] = await db
      .update(exercises)
      .set({ ...exercise, updatedAt: new Date() })
      .where(eq(exercises.id, id))
      .returning();
    return updated;
  }

  async deleteExercise(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  // Plan exercise operations
  async createPlanExercise(planExercise: InsertPlanExercise): Promise<PlanExercise> {
    const [created] = await db.insert(planExercises).values(planExercise).returning();
    return created;
  }

  async createPlanExercises(planId: string, exercises: Array<Omit<InsertPlanExercise, 'planId'>>): Promise<void> {
    if (exercises.length === 0) return;
    
    const planExercisesToInsert = exercises.map(exercise => ({
      ...exercise,
      planId
    }));
    
    await db.insert(planExercises).values(planExercisesToInsert);
  }

  async getPlanExercise(id: string): Promise<PlanExercise | undefined> {
    const [result] = await db
      .select()
      .from(planExercises)
      .where(eq(planExercises.id, id));
    return result;
  }

  async getPlanExercisesByPlan(planId: string): Promise<PlanExercise[]> {
    const results = await db
      .select({
        id: planExercises.id,
        planId: planExercises.planId,
        exerciseId: planExercises.exerciseId,
        dayOfWeek: planExercises.dayOfWeek,
        week: planExercises.week,
        sets: planExercises.sets,
        reps: planExercises.reps,
        weight: planExercises.weight,
        duration: planExercises.duration,
        restTime: planExercises.restTime,
        notes: planExercises.notes,
        exerciseName: exercises.name,
      })
      .from(planExercises)
      .leftJoin(exercises, eq(planExercises.exerciseId, exercises.id))
      .where(eq(planExercises.planId, planId));
    
    return results as any;
  }

  async updatePlanExercise(id: string, planExercise: Partial<InsertPlanExercise>): Promise<PlanExercise> {
    const [updated] = await db
      .update(planExercises)
      .set(planExercise)
      .where(eq(planExercises.id, id))
      .returning();
    return updated;
  }

  async deletePlanExercise(id: string): Promise<void> {
    await db.delete(planExercises).where(eq(planExercises.id, id));
  }

  // Client plan operations
  async assignPlanToClient(clientPlan: InsertClientPlan): Promise<ClientPlan> {
    const [created] = await db.insert(clientPlans).values(clientPlan).returning();
    return created;
  }

  async replaceClientPlanAssignment(clientPlan: InsertClientPlan): Promise<ClientPlan> {
    return await db.transaction(async (tx) => {
      await tx.delete(clientPlans).where(eq(clientPlans.clientId, clientPlan.clientId));
      const [created] = await tx.insert(clientPlans).values(clientPlan).returning();
      return created;
    });
  }

  async getClientPlans(clientId: string): Promise<ClientPlan[]> {
    return await db.select().from(clientPlans).where(eq(clientPlans.clientId, clientId));
  }

  async getActiveClientPlan(clientId: string): Promise<ClientPlan | undefined> {
    const [plan] = await db
      .select()
      .from(clientPlans)
      .where(and(eq(clientPlans.clientId, clientId), eq(clientPlans.isActive, true)));
    return plan;
  }

  async updateClientPlan(id: string, updates: Partial<InsertClientPlan>): Promise<ClientPlan> {
    const [updated] = await db
      .update(clientPlans)
      .set(updates)
      .where(eq(clientPlans.id, id))
      .returning();
    return updated;
  }

  // Workout log operations
  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const [created] = await db.insert(workoutLogs).values(log).returning();
    return created;
  }

  async updateWorkoutLog(id: string, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog> {
    const [updated] = await db
      .update(workoutLogs)
      .set({ ...log, updatedAt: new Date() })
      .where(eq(workoutLogs.id, id))
      .returning();
    return updated;
  }

  async getWorkoutLogsByClient(clientId: string): Promise<WorkoutLog[]> {
    return await db
      .select()
      .from(workoutLogs)
      .where(eq(workoutLogs.clientId, clientId))
      .orderBy(desc(workoutLogs.completedAt));
  }

  async getWorkoutLogsByExercise(clientId: string, planExerciseId: string): Promise<WorkoutLog[]> {
    return await db
      .select()
      .from(workoutLogs)
      .where(and(eq(workoutLogs.clientId, clientId), eq(workoutLogs.planExerciseId, planExerciseId)))
      .orderBy(desc(workoutLogs.completedAt));
  }

  async getWorkoutLogsByDateRange(clientId: string, startDate: Date, endDate: Date): Promise<WorkoutLog[]> {
    return await db
      .select()
      .from(workoutLogs)
      .where(and(
        eq(workoutLogs.clientId, clientId),
        gte(workoutLogs.completedAt, startDate),
        lte(workoutLogs.completedAt, endDate)
      ))
      .orderBy(desc(workoutLogs.completedAt));
  }

  async deleteWorkoutLog(id: string): Promise<void> {
    await db.delete(workoutLogs).where(eq(workoutLogs.id, id));
  }

  // Food entry operations
  async createFoodEntry(entry: InsertFoodEntry): Promise<FoodEntry> {
    const [created] = await db.insert(foodEntries).values(entry).returning();
    return created;
  }

  async getFoodEntryById(entryId: string): Promise<FoodEntry | undefined> {
    const [entry] = await db
      .select()
      .from(foodEntries)
      .where(eq(foodEntries.id, entryId));
    return entry;
  }

  async getFoodEntriesByClient(clientId: string): Promise<FoodEntry[]> {
    return await db
      .select()
      .from(foodEntries)
      .where(eq(foodEntries.clientId, clientId))
      .orderBy(desc(foodEntries.date));
  }

  async getFoodEntriesByDate(clientId: string, date: Date): Promise<FoodEntry[]> {
    // Create new Date objects to avoid mutating the original
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    
    return await db
      .select()
      .from(foodEntries)
      .where(and(
        eq(foodEntries.clientId, clientId),
        gte(foodEntries.date, startOfDay),
        lte(foodEntries.date, endOfDay)
      ))
      .orderBy(desc(foodEntries.date));
  }

  async getFoodEntriesByDateRange(clientId: string, startDate: Date, endDate: Date): Promise<FoodEntry[]> {
    return await db
      .select()
      .from(foodEntries)
      .where(and(
        eq(foodEntries.clientId, clientId),
        gte(foodEntries.date, startDate),
        lte(foodEntries.date, endDate)
      ))
      .orderBy(desc(foodEntries.date));
  }

  async updateFoodEntry(id: string, entry: Partial<InsertFoodEntry>): Promise<FoodEntry> {
    const [updated] = await db
      .update(foodEntries)
      .set(entry)
      .where(eq(foodEntries.id, id))
      .returning();
    return updated;
  }

  async deleteFoodEntry(id: string): Promise<void> {
    await db.delete(foodEntries).where(eq(foodEntries.id, id));
  }

  // Cardio activity operations
  async createCardioActivity(activity: InsertCardioActivity): Promise<CardioActivity> {
    const [created] = await db.insert(cardioActivities).values(activity).returning();
    return created;
  }

  async getCardioActivityById(activityId: string): Promise<CardioActivity | undefined> {
    const [activity] = await db
      .select()
      .from(cardioActivities)
      .where(eq(cardioActivities.id, activityId));
    return activity;
  }

  async getCardioActivitiesByClient(clientId: string): Promise<CardioActivity[]> {
    return await db
      .select()
      .from(cardioActivities)
      .where(eq(cardioActivities.clientId, clientId))
      .orderBy(desc(cardioActivities.date));
  }

  async getCardioActivitiesByDate(clientId: string, date: Date): Promise<CardioActivity[]> {
    // Create new Date objects to avoid mutating the original
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    
    return await db
      .select()
      .from(cardioActivities)
      .where(and(
        eq(cardioActivities.clientId, clientId),
        gte(cardioActivities.date, startOfDay),
        lte(cardioActivities.date, endOfDay)
      ))
      .orderBy(desc(cardioActivities.date));
  }

  async getCardioActivitiesByDateRange(clientId: string, startDate: Date, endDate: Date): Promise<CardioActivity[]> {
    return await db
      .select()
      .from(cardioActivities)
      .where(and(
        eq(cardioActivities.clientId, clientId),
        gte(cardioActivities.date, startDate),
        lte(cardioActivities.date, endDate)
      ))
      .orderBy(desc(cardioActivities.date));
  }

  async updateCardioActivity(id: string, activity: Partial<InsertCardioActivity>): Promise<CardioActivity> {
    const [updated] = await db
      .update(cardioActivities)
      .set(activity)
      .where(eq(cardioActivities.id, id))
      .returning();
    return updated;
  }

  async deleteCardioActivity(id: string): Promise<void> {
    await db.delete(cardioActivities).where(eq(cardioActivities.id, id));
  }

  // Custom calorie entry operations
  async createCustomCalorieEntry(entry: InsertCustomCalorieEntry): Promise<CustomCalorieEntry> {
    const [created] = await db.insert(customCalorieEntries).values(entry).returning();
    return created;
  }

  async getCustomCalorieEntryById(entryId: string): Promise<CustomCalorieEntry | undefined> {
    const [entry] = await db
      .select()
      .from(customCalorieEntries)
      .where(eq(customCalorieEntries.id, entryId));
    return entry;
  }

  async getCustomCalorieEntriesByClient(clientId: string): Promise<CustomCalorieEntry[]> {
    return await db
      .select()
      .from(customCalorieEntries)
      .where(eq(customCalorieEntries.clientId, clientId))
      .orderBy(desc(customCalorieEntries.date));
  }

  async getCustomCalorieEntriesByDate(clientId: string, date: Date): Promise<CustomCalorieEntry[]> {
    // Create new Date objects to avoid mutating the original
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    
    return await db
      .select()
      .from(customCalorieEntries)
      .where(and(
        eq(customCalorieEntries.clientId, clientId),
        gte(customCalorieEntries.date, startOfDay),
        lte(customCalorieEntries.date, endOfDay)
      ))
      .orderBy(desc(customCalorieEntries.date));
  }

  async updateCustomCalorieEntry(id: string, entry: Partial<UpdateCustomCalorieEntry>): Promise<CustomCalorieEntry> {
    const [updated] = await db
      .update(customCalorieEntries)
      .set(entry)
      .where(eq(customCalorieEntries.id, id))
      .returning();
    return updated;
  }

  async deleteCustomCalorieEntry(id: string): Promise<void> {
    await db.delete(customCalorieEntries).where(eq(customCalorieEntries.id, id));
  }

  // Calorie tracking operations
  async getCalorieSummaryByDate(clientId: string, date: Date): Promise<{
    goal: number;
    total: number;
    remaining: number;
    breakdown: {
      foodEntries: number;
      customEntries: number;
    };
    items: Array<{
      type: 'food' | 'custom';
      id: string;
      description: string;
      calories: number;
      mealType?: string;
      isIncludedInCalories?: boolean;
    }>;
  }> {
    // Get calorie goal for the client
    const goal = await this.getCalorieGoal(clientId);

    // Create new Date objects to avoid mutating the original
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    // Get food entries for the date (only those included in calories)
    const foodResults = await db
      .select()
      .from(foodEntries)
      .where(and(
        eq(foodEntries.clientId, clientId),
        gte(foodEntries.date, startOfDay),
        lte(foodEntries.date, endOfDay),
        eq(foodEntries.isIncludedInCalories, true)
      ))
      .orderBy(desc(foodEntries.date));

    // Get custom calorie entries for the date
    const customResults = await db
      .select()
      .from(customCalorieEntries)
      .where(and(
        eq(customCalorieEntries.clientId, clientId),
        gte(customCalorieEntries.date, startOfDay),
        lte(customCalorieEntries.date, endOfDay)
      ))
      .orderBy(desc(customCalorieEntries.date));

    // Calculate totals
    const foodCalories = foodResults.reduce((sum, entry) => sum + (entry.calories || 0), 0);
    const customCalories = customResults.reduce((sum, entry) => sum + entry.calories, 0);
    const total = foodCalories + customCalories;

    // Build items array
    const items: Array<{
      type: 'food' | 'custom';
      id: string;
      description: string;
      calories: number;
      mealType?: string;
      isIncludedInCalories?: boolean;
    }> = [
      ...foodResults.map(entry => ({
        type: 'food' as const,
        id: entry.id,
        description: entry.description,
        calories: entry.calories || 0,
        mealType: entry.mealType,
        isIncludedInCalories: entry.isIncludedInCalories ?? undefined,
      })),
      ...customResults.map(entry => ({
        type: 'custom' as const,
        id: entry.id,
        description: entry.description,
        calories: entry.calories,
        mealType: entry.mealType || undefined,
      }))
    ];

    // Sort items by date (most recent first)
    items.sort((a, b) => {
      const aEntry = a.type === 'food' ? foodResults.find(f => f.id === a.id) : customResults.find(c => c.id === a.id);
      const bEntry = b.type === 'food' ? foodResults.find(f => f.id === b.id) : customResults.find(c => c.id === b.id);
      const aDate = aEntry?.date || new Date(0);
      const bDate = bEntry?.date || new Date(0);
      return bDate.getTime() - aDate.getTime();
    });

    return {
      goal,
      total,
      remaining: Math.max(0, goal - total),
      breakdown: {
        foodEntries: foodCalories,
        customEntries: customCalories,
      },
      items,
    };
  }

  /**
   * Get the calorie goal for a client using priority order:
   * 1. Training plan dailyCalories (primary source)
   * 2. Client manual override (fallback if no training plan or plan has no calories)
   * 3. Default 2000 calories (final fallback)
   */
  async getCalorieGoal(clientId: string): Promise<number> {
    // Get client data
    const client = await this.getClient(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // First, check for goal from the client's active training plan (primary source)
    const activePlan = await this.getActiveClientPlan(clientId);
    if (activePlan) {
      const trainingPlan = await this.getTrainingPlan(activePlan.planId);
      if (trainingPlan && trainingPlan.dailyCalories) {
        return trainingPlan.dailyCalories;
      }
    }

    // Fallback to client's manual override if no training plan or plan has no dailyCalories
    if (client.calorieGoalOverride) {
      return client.calorieGoalOverride;
    }

    // Default calorie goal if no plan or manual override is set
    return 2000;
  }

  /**
   * Set a manual calorie goal override for a client.
   * This override will only be used as a fallback if:
   * - The client has no active training plan, OR
   * - The active training plan has no dailyCalories set
   * Training plan dailyCalories always take priority when available.
   */
  async setCalorieGoal(clientId: string, goal: number): Promise<void> {
    await db
      .update(clients)
      .set({ 
        calorieGoalOverride: goal,
        updatedAt: new Date() 
      })
      .where(eq(clients.id, clientId));
  }

  // USDA Food Cache operations
  async cacheUsdaFood(food: InsertUsdaFoodCache): Promise<UsdaFoodCache> {
    const [cached] = await db.insert(usdaFoodsCache).values(food).returning();
    return cached;
  }

  async getUsdaFoodByFdcId(fdcId: string): Promise<UsdaFoodCache | undefined> {
    const [food] = await db.select().from(usdaFoodsCache).where(eq(usdaFoodsCache.fdcId, fdcId));
    return food;
  }

  async updateUsdaFoodLastUsed(fdcId: string): Promise<void> {
    await db
      .update(usdaFoodsCache)
      .set({ lastUsed: new Date(), refreshedAt: new Date() })
      .where(eq(usdaFoodsCache.fdcId, fdcId));
  }

  // Meal Plan operations
  async createMealPlan(plan: InsertMealPlan): Promise<MealPlan> {
    const [created] = await db.insert(mealPlans).values(plan).returning();
    return created;
  }

  async getMealPlan(id: string): Promise<MealPlan | undefined> {
    const [plan] = await db.select().from(mealPlans).where(eq(mealPlans.id, id));
    return plan;
  }

  async getMealPlansByTrainer(trainerId: string): Promise<MealPlan[]> {
    return await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.trainerId, trainerId))
      .orderBy(desc(mealPlans.createdAt));
  }

  async updateMealPlan(id: string, plan: Partial<InsertMealPlan>): Promise<MealPlan> {
    const [updated] = await db
      .update(mealPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(mealPlans.id, id))
      .returning();
    return updated;
  }

  async deleteMealPlan(id: string): Promise<void> {
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
  }

  // Meal Plan Assignment operations
  async createMealPlanAssignment(assignment: InsertMealPlanAssignment): Promise<MealPlanAssignment> {
    const [created] = await db.insert(mealPlanAssignments).values(assignment).returning();
    return created;
  }

  async replaceMealPlanAssignment(assignment: InsertMealPlanAssignment): Promise<MealPlanAssignment> {
    return await db.transaction(async (tx) => {
      await tx.delete(mealPlanAssignments).where(eq(mealPlanAssignments.clientId, assignment.clientId));
      const [created] = await tx.insert(mealPlanAssignments).values(assignment).returning();
      return created;
    });
  }

  async getMealPlanAssignment(id: string): Promise<MealPlanAssignment | undefined> {
    const [assignment] = await db.select().from(mealPlanAssignments).where(eq(mealPlanAssignments.id, id));
    return assignment;
  }

  async getMealPlanAssignmentsByClient(clientId: string): Promise<MealPlanAssignment[]> {
    return await db
      .select()
      .from(mealPlanAssignments)
      .where(eq(mealPlanAssignments.clientId, clientId))
      .orderBy(desc(mealPlanAssignments.createdAt));
  }

  async getMealPlanAssignmentsByPlan(planId: string): Promise<MealPlanAssignment[]> {
    return await db
      .select()
      .from(mealPlanAssignments)
      .where(eq(mealPlanAssignments.mealPlanId, planId))
      .orderBy(desc(mealPlanAssignments.createdAt));
  }

  async getActiveMealPlanAssignment(clientId: string): Promise<MealPlanAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(mealPlanAssignments)
      .where(and(eq(mealPlanAssignments.clientId, clientId), eq(mealPlanAssignments.isActive, true)))
      .orderBy(desc(mealPlanAssignments.createdAt))
      .limit(1);
    return assignment;
  }

  async updateMealPlanAssignment(id: string, assignment: Partial<InsertMealPlanAssignment>): Promise<MealPlanAssignment> {
    const [updated] = await db
      .update(mealPlanAssignments)
      .set(assignment)
      .where(eq(mealPlanAssignments.id, id))
      .returning();
    return updated;
  }

  async deleteMealPlanAssignment(id: string): Promise<void> {
    await db.delete(mealPlanAssignments).where(eq(mealPlanAssignments.id, id));
  }

  // Meal Day operations
  async createMealDay(day: InsertMealDay): Promise<MealDay> {
    const [created] = await db.insert(mealDays).values(day).returning();
    return created;
  }

  async getMealDaysByPlan(planId: string): Promise<MealDay[]> {
    return await db
      .select()
      .from(mealDays)
      .where(eq(mealDays.mealPlanId, planId))
      .orderBy(mealDays.dayNumber);
  }

  async updateMealDay(id: string, day: Partial<InsertMealDay>): Promise<MealDay> {
    const [updated] = await db
      .update(mealDays)
      .set(day)
      .where(eq(mealDays.id, id))
      .returning();
    return updated;
  }

  async deleteMealDay(id: string): Promise<void> {
    await db.delete(mealDays).where(eq(mealDays.id, id));
  }

  // Meal operations
  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [created] = await db.insert(meals).values(meal).returning();
    return created;
  }

  async getMealsByDay(dayId: string): Promise<Meal[]> {
    return await db
      .select()
      .from(meals)
      .where(eq(meals.mealDayId, dayId));
  }

  async updateMeal(id: string, meal: Partial<InsertMeal>): Promise<Meal> {
    const [updated] = await db
      .update(meals)
      .set(meal)
      .where(eq(meals.id, id))
      .returning();
    return updated;
  }

  async deleteMeal(id: string): Promise<void> {
    await db.delete(meals).where(eq(meals.id, id));
  }

  // Meal Item operations
  async createMealItem(item: InsertMealItem): Promise<MealItem> {
    const [created] = await db.insert(mealItems).values(item).returning();
    return created;
  }

  async getMealItemsByMeal(mealId: string): Promise<MealItem[]> {
    return await db
      .select()
      .from(mealItems)
      .where(eq(mealItems.mealId, mealId));
  }

  async updateMealItem(id: string, item: Partial<InsertMealItem>): Promise<MealItem> {
    const [updated] = await db
      .update(mealItems)
      .set(item)
      .where(eq(mealItems.id, id))
      .returning();
    return updated;
  }

  async deleteMealItem(id: string): Promise<void> {
    await db.delete(mealItems).where(eq(mealItems.id, id));
  }

  // Supplement Item Library operations (trainer-owned reusable items)
  async createSupplementItem(item: InsertSupplementItem): Promise<SupplementItem> {
    const [created] = await db.insert(supplementItems).values(item).returning();
    return created;
  }

  async getSupplementItem(id: string): Promise<SupplementItem | undefined> {
    const [item] = await db.select().from(supplementItems).where(eq(supplementItems.id, id));
    return item;
  }

  async getSupplementItemsByTrainer(trainerId: string): Promise<SupplementItem[]> {
    return await db
      .select()
      .from(supplementItems)
      .where(eq(supplementItems.trainerId, trainerId))
      .orderBy(desc(supplementItems.createdAt));
  }

  async updateSupplementItem(id: string, item: Partial<InsertSupplementItem>): Promise<SupplementItem> {
    const [updated] = await db
      .update(supplementItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(supplementItems.id, id))
      .returning();
    return updated;
  }

  async deleteSupplementItem(id: string): Promise<void> {
    await db.delete(supplementItems).where(eq(supplementItems.id, id));
  }

  // Supplement Plan Template operations (templates can be assigned to multiple clients)
  async createSupplementPlan(plan: InsertSupplementPlan): Promise<SupplementPlan> {
    const [created] = await db.insert(supplementPlans).values(plan).returning();
    return created;
  }

  async getSupplementPlan(id: string): Promise<SupplementPlan | undefined> {
    const [plan] = await db.select().from(supplementPlans).where(eq(supplementPlans.id, id));
    return plan;
  }

  async getSupplementPlansByTrainer(trainerId: string): Promise<SupplementPlan[]> {
    return await db
      .select()
      .from(supplementPlans)
      .where(eq(supplementPlans.trainerId, trainerId))
      .orderBy(desc(supplementPlans.createdAt));
  }

  async updateSupplementPlan(id: string, plan: Partial<InsertSupplementPlan>): Promise<SupplementPlan> {
    const [updated] = await db
      .update(supplementPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(supplementPlans.id, id))
      .returning();
    return updated;
  }

  async deleteSupplementPlan(id: string): Promise<void> {
    await db.delete(supplementPlans).where(eq(supplementPlans.id, id));
  }

  // Supplement Plan Item operations (junction table)
  async createSupplementPlanItem(item: InsertSupplementPlanItem): Promise<SupplementPlanItem> {
    const [created] = await db.insert(supplementPlanItems).values(item).returning();
    return created;
  }

  async getSupplementPlanItemsByPlan(planId: string): Promise<SupplementPlanItem[]> {
    return await db
      .select()
      .from(supplementPlanItems)
      .where(eq(supplementPlanItems.supplementPlanId, planId));
  }

  async updateSupplementPlanItem(id: string, item: Partial<InsertSupplementPlanItem>): Promise<SupplementPlanItem> {
    const [updated] = await db
      .update(supplementPlanItems)
      .set(item)
      .where(eq(supplementPlanItems.id, id))
      .returning();
    return updated;
  }

  async deleteSupplementPlanItem(id: string): Promise<void> {
    await db.delete(supplementPlanItems).where(eq(supplementPlanItems.id, id));
  }

  // Supplement Plan Assignment operations (links templates to clients)
  async createSupplementPlanAssignment(assignment: InsertSupplementPlanAssignment): Promise<SupplementPlanAssignment> {
    const [created] = await db.insert(supplementPlanAssignments).values(assignment).returning();
    return created;
  }

  async replaceSupplementPlanAssignment(assignment: InsertSupplementPlanAssignment): Promise<SupplementPlanAssignment> {
    return await db.transaction(async (tx) => {
      await tx.delete(supplementPlanAssignments).where(eq(supplementPlanAssignments.clientId, assignment.clientId));
      const [created] = await tx.insert(supplementPlanAssignments).values(assignment).returning();
      return created;
    });
  }

  async getSupplementPlanAssignment(id: string): Promise<SupplementPlanAssignment | undefined> {
    const [assignment] = await db.select().from(supplementPlanAssignments).where(eq(supplementPlanAssignments.id, id));
    return assignment;
  }

  async getSupplementPlanAssignmentsByClient(clientId: string): Promise<SupplementPlanAssignment[]> {
    return await db
      .select()
      .from(supplementPlanAssignments)
      .where(eq(supplementPlanAssignments.clientId, clientId))
      .orderBy(desc(supplementPlanAssignments.createdAt));
  }

  async getSupplementPlanAssignmentsByPlan(planId: string): Promise<SupplementPlanAssignment[]> {
    return await db
      .select()
      .from(supplementPlanAssignments)
      .where(eq(supplementPlanAssignments.supplementPlanId, planId))
      .orderBy(desc(supplementPlanAssignments.createdAt));
  }

  async getActiveSupplementPlanAssignment(clientId: string): Promise<SupplementPlanAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(supplementPlanAssignments)
      .where(and(eq(supplementPlanAssignments.clientId, clientId), eq(supplementPlanAssignments.isActive, true)))
      .orderBy(desc(supplementPlanAssignments.createdAt))
      .limit(1);
    return assignment;
  }

  async updateSupplementPlanAssignment(id: string, assignment: Partial<InsertSupplementPlanAssignment>): Promise<SupplementPlanAssignment> {
    const [updated] = await db
      .update(supplementPlanAssignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(supplementPlanAssignments.id, id))
      .returning();
    return updated;
  }

  async deleteSupplementPlanAssignment(id: string): Promise<void> {
    await db.delete(supplementPlanAssignments).where(eq(supplementPlanAssignments.id, id));
  }

  // Monthly evaluation operations
  async createMonthlyEvaluation(evaluation: InsertMonthlyEvaluation): Promise<MonthlyEvaluation> {
    const [created] = await db.insert(monthlyEvaluations).values(evaluation).returning();
    return created;
  }

  async getMonthlyEvaluation(id: string): Promise<MonthlyEvaluation | undefined> {
    const [evaluation] = await db.select().from(monthlyEvaluations).where(eq(monthlyEvaluations.id, id));
    return evaluation;
  }

  async getMonthlyEvaluationsByClient(clientId: string): Promise<MonthlyEvaluation[]> {
    return await db
      .select()
      .from(monthlyEvaluations)
      .where(eq(monthlyEvaluations.clientId, clientId))
      .orderBy(desc(monthlyEvaluations.createdAt));
  }

  // Post operations
  async createPost(post: InsertPost): Promise<Post> {
    const [created] = await db.insert(posts).values(post).returning();
    return created;
  }

  async getPostsByTrainer(trainerId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.trainerId, trainerId))
      .orderBy(desc(posts.createdAt));
  }

  async updatePost(id: string, post: Partial<InsertPost>): Promise<Post> {
    const [updated] = await db
      .update(posts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updated;
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async getChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(
        sql`(${chatMessages.senderId} = ${userId1} AND ${chatMessages.receiverId} = ${userId2}) OR 
            (${chatMessages.senderId} = ${userId2} AND ${chatMessages.receiverId} = ${userId1})`
      )
      .orderBy(chatMessages.createdAt);
  }

  async markMessagesAsRead(receiverId: string, senderId: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(and(eq(chatMessages.receiverId, receiverId), eq(chatMessages.senderId, senderId)));
  }

  // Payment plan operations
  async getAllPaymentPlans(): Promise<PaymentPlan[]> {
    return await db.select().from(paymentPlans).orderBy(paymentPlans.type, paymentPlans.amount);
  }

  async getActivePaymentPlans(): Promise<PaymentPlan[]> {
    return await db.select().from(paymentPlans)
      .where(eq(paymentPlans.isActive, true))
      .orderBy(paymentPlans.type, paymentPlans.amount);
  }

  async createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan> {
    const [created] = await db.insert(paymentPlans).values(plan).returning();
    return created;
  }

  async updatePaymentPlan(id: string, plan: Partial<InsertPaymentPlan>): Promise<PaymentPlan> {
    const [updated] = await db
      .update(paymentPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(paymentPlans.id, id))
      .returning();
    return updated;
  }

  async deletePaymentPlan(id: string): Promise<void> {
    await db.delete(paymentPlans).where(eq(paymentPlans.id, id));
  }

  // Check if trainer can chat with specific user
  async canTrainerChatWithUser(trainerId: string, targetUserId: string): Promise<boolean> {
    // Check if targetUser is superadmin
    const targetUser = await this.getUser(targetUserId);
    if (targetUser?.role === 'superadmin') {
      return true; // Trainers can always chat with superadmin
    }

    // Check if targetUser is trainer's client
    const client = await this.getClientByUserId(targetUserId);
    if (client && client.trainerId === trainerId) {
      return true;
    }

    return false;
  }

  // Analytics operations
  async getTrainerStats(trainerId: string): Promise<{
    totalClients: number;
    activeClients: number;
    monthlyRevenue: number;
    totalPlans: number;
  }> {
    const [stats] = await db
      .select({
        totalClients: count(clients.id),
        activeClients: count(sql`CASE WHEN ${users.status} = 'active' THEN 1 END`),
        monthlyRevenue: sum(clientPaymentPlans.amount),
        totalPlans: count(trainingPlans.id),
      })
      .from(trainers)
      .leftJoin(clients, eq(trainers.id, clients.trainerId))
      .leftJoin(users, eq(clients.userId, users.id))
      .leftJoin(clientPaymentPlans, eq(clients.clientPaymentPlanId, clientPaymentPlans.id))
      .leftJoin(trainingPlans, eq(trainers.id, trainingPlans.trainerId))
      .where(eq(trainers.id, trainerId))
      .groupBy(trainers.id);

    return {
      totalClients: Number(stats?.totalClients || 0),
      activeClients: Number(stats?.activeClients || 0),
      monthlyRevenue: Number(stats?.monthlyRevenue || 0),
      totalPlans: Number(stats?.totalPlans || 0),
    };
  }

  async getClientStats(clientId: string): Promise<{
    workoutsThisWeek: number;
    currentWeight: number;
    goalProgress: number;
    streak: number;
  }> {
    // This is a simplified implementation - in a real app you'd need more complex queries
    const client = await this.getClient(clientId);
    const evaluations = await this.getMonthlyEvaluationsByClient(clientId);
    const workoutLogs = await this.getWorkoutLogsByClient(clientId);

    const currentWeight = evaluations[0]?.weight ? Number(evaluations[0].weight) : Number(client?.weight || 0);
    const workoutsThisWeek = workoutLogs.filter(log => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return log.completedAt && log.completedAt > weekAgo;
    }).length;

    return {
      workoutsThisWeek,
      currentWeight,
      goalProgress: 75, // This would need proper calculation based on goals
      streak: 12, // This would need proper calculation based on consecutive workout days
    };
  }

  async getSystemStats(): Promise<{
    totalTrainers: number;
    activeTrainers: number;
    totalClients: number;
    monthlyRevenue: number;
  }> {
    const [stats] = await db
      .select({
        totalTrainers: count(trainers.id),
        activeTrainers: count(sql`CASE WHEN ${users.status} = 'active' THEN 1 END`),
        totalClients: count(clients.id),
        monthlyRevenue: sum(trainers.monthlyRevenue),
      })
      .from(trainers)
      .leftJoin(users, eq(trainers.userId, users.id))
      .leftJoin(clients, eq(trainers.id, clients.trainerId));

    return {
      totalTrainers: Number(stats?.totalTrainers || 0),
      activeTrainers: Number(stats?.activeTrainers || 0),
      totalClients: Number(stats?.totalClients || 0),
      monthlyRevenue: Number(stats?.monthlyRevenue || 0),
    };
  }

  // Admin view all clients with filtering
  async getAllClientsAdmin(filters: { trainer?: string; search?: string; status?: string }): Promise<any[]> {
    try {
      // First get all clients with their user info
      let clientsQuery = db
        .select()
        .from(clients)
        .innerJoin(users, eq(clients.userId, users.id));

      const conditions = [];
      
      if (filters.trainer) {
        conditions.push(eq(clients.trainerId, filters.trainer));
      }
      
      if (filters.search) {
        conditions.push(
          sql`(${users.email} ILIKE ${`%${filters.search}%`} OR 
              ${users.firstName} ILIKE ${`%${filters.search}%`} OR 
              ${users.lastName} ILIKE ${`%${filters.search}%`})`
        );
      }
      
      if (filters.status) {
        conditions.push(eq(users.status, filters.status as any));
      }

      if (conditions.length > 0) {
        const whereCondition = conditions.reduce((acc, condition, index) => 
          index === 0 ? condition : sql`${acc} AND ${condition}`
        );
        clientsQuery = clientsQuery.where(whereCondition);
      }

      const clientResults = await clientsQuery.orderBy(desc(clients.createdAt));

      // Then get trainer info separately to avoid complex joins
      const result = [];
      for (const row of clientResults) {
        const client = row.clients;
        const user = row.users;
        
        let trainerInfo = null;
        if (client.trainerId) {
          const trainer = await this.getTrainer(client.trainerId);
          if (trainer) {
            const trainerUser = await this.getUser(trainer.userId);
            trainerInfo = {
              trainerEmail: trainerUser?.email,
              trainerFirstName: trainerUser?.firstName,
              trainerLastName: trainerUser?.lastName,
            };
          }
        }

        result.push({
          ...client,
          userEmail: user.email,
          userFirstName: user.firstName,
          userLastName: user.lastName,
          userProfileImageUrl: user.profileImageUrl,
          userStatus: user.status,
          ...trainerInfo,
        });
      }

      return result;
    } catch (error) {
      console.error("Error in getAllClientsAdmin:", error);
      return [];
    }
  }

  // Admin view all training plans with filtering
  async getAllTrainingPlansAdmin(filters: { trainer?: string; search?: string }): Promise<any[]> {
    try {
      let query = db.select().from(trainingPlans);

      const conditions = [];
      
      if (filters.trainer) {
        conditions.push(eq(trainingPlans.trainerId, filters.trainer));
      }
      
      if (filters.search) {
        conditions.push(
          sql`(${trainingPlans.name} ILIKE ${`%${filters.search}%`} OR 
              ${trainingPlans.description} ILIKE ${`%${filters.search}%`})`
        );
      }

      if (conditions.length > 0) {
        const whereCondition = conditions.reduce((acc, condition, index) => 
          index === 0 ? condition : sql`${acc} AND ${condition}`
        );
        query = query.where(whereCondition);
      }

      const planResults = await query.orderBy(desc(trainingPlans.createdAt));

      // Get trainer info separately
      const result = [];
      for (const plan of planResults) {
        let trainerInfo = null;
        if (plan.trainerId) {
          const trainer = await this.getTrainer(plan.trainerId);
          if (trainer) {
            const trainerUser = await this.getUser(trainer.userId);
            trainerInfo = {
              trainerEmail: trainerUser?.email,
              trainerFirstName: trainerUser?.firstName,
              trainerLastName: trainerUser?.lastName,
            };
          }
        }

        result.push({
          ...plan,
          ...trainerInfo,
        });
      }

      return result;
    } catch (error) {
      console.error("Error in getAllTrainingPlansAdmin:", error);
      return [];
    }
  }

  // Admin view all exercises with filtering
  async getAllExercisesAdmin(filters: { trainer?: string; search?: string; category?: string }): Promise<any[]> {
    try {
      let query = db.select().from(exercises);

      const conditions = [];
      
      if (filters.trainer) {
        conditions.push(eq(exercises.trainerId, filters.trainer));
      }
      
      if (filters.search) {
        conditions.push(
          sql`(${exercises.name} ILIKE ${`%${filters.search}%`} OR 
              ${exercises.description} ILIKE ${`%${filters.search}%`})`
        );
      }
      
      if (filters.category) {
        conditions.push(eq(exercises.category, filters.category));
      }

      if (conditions.length > 0) {
        const whereCondition = conditions.reduce((acc, condition, index) => 
          index === 0 ? condition : sql`${acc} AND ${condition}`
        );
        query = query.where(whereCondition);
      }

      const exerciseResults = await query.orderBy(desc(exercises.createdAt));

      // Get trainer info separately
      const result = [];
      for (const exercise of exerciseResults) {
        let trainerInfo = null;
        if (exercise.trainerId) {
          const trainer = await this.getTrainer(exercise.trainerId);
          if (trainer) {
            const trainerUser = await this.getUser(trainer.userId);
            trainerInfo = {
              trainerEmail: trainerUser?.email,
              trainerFirstName: trainerUser?.firstName,
              trainerLastName: trainerUser?.lastName,
            };
          }
        }

        result.push({
          ...exercise,
          ...trainerInfo,
        });
      }

      return result;
    } catch (error) {
      console.error("Error in getAllExercisesAdmin:", error);
      return [];
    }
  }

  // Trainer management methods
  async getTrainersWithDetails(): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: trainers.id,
          userId: trainers.userId,
          referralCode: trainers.referralCode,
          expertise: trainers.expertise,
          experience: trainers.experience,
          gallery: trainers.gallery,
          monthlyRevenue: trainers.monthlyRevenue,
          paymentPlanId: trainers.paymentPlanId,
          createdAt: trainers.createdAt,
          updatedAt: trainers.updatedAt,
        })
        .from(trainers)
        .orderBy(desc(trainers.createdAt));

      // Get additional details for each trainer
      const detailedTrainers = [];
      for (const trainer of result) {
        const user = await this.getUser(trainer.userId);
        let paymentPlan = null;
        if (trainer.paymentPlanId) {
          const [plan] = await db.select().from(paymentPlans).where(eq(paymentPlans.id, trainer.paymentPlanId));
          paymentPlan = plan;
        }

        // Get client count
        const [clientCount] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(clients)
          .where(eq(clients.trainerId, trainer.id));

        detailedTrainers.push({
          ...trainer,
          user,
          paymentPlan,
          clientCount: clientCount?.count || 0,
        });
      }

      return detailedTrainers;
    } catch (error) {
      console.error("Error in getTrainersWithDetails:", error);
      return [];
    }
  }

  async updateTrainerPaymentPlan(trainerId: string, paymentPlanId: string | null): Promise<void> {
    await db
      .update(trainers)
      .set({ 
        paymentPlanId,
        updatedAt: new Date() 
      })
      .where(eq(trainers.id, trainerId));
  }

  async updateTrainerStatus(trainerId: string, status: string): Promise<void> {
    // First get the trainer to find the user ID
    const [trainer] = await db
      .select({ userId: trainers.userId })
      .from(trainers)
      .where(eq(trainers.id, trainerId));

    if (!trainer) {
      throw new Error('Trainer not found');
    }

    // Update the user status
    await db
      .update(users)
      .set({ 
        status: status as any,
        updatedAt: new Date() 
      })
      .where(eq(users.id, trainer.userId));
  }

  // Client payment plan operations (Trainers manage client payment plans)
  async createClientPaymentPlan(plan: InsertClientPaymentPlan): Promise<ClientPaymentPlan> {
    const [created] = await db
      .insert(clientPaymentPlans)
      .values(plan)
      .returning();
    return created;
  }

  async getClientPaymentPlansByTrainer(trainerId: string): Promise<ClientPaymentPlan[]> {
    return await db
      .select()
      .from(clientPaymentPlans)
      .where(eq(clientPaymentPlans.trainerId, trainerId))
      .orderBy(desc(clientPaymentPlans.createdAt));
  }

  async getClientPaymentPlan(id: string): Promise<ClientPaymentPlan | undefined> {
    const [plan] = await db
      .select()
      .from(clientPaymentPlans)
      .where(eq(clientPaymentPlans.id, id));
    return plan;
  }

  async updateClientPaymentPlan(id: string, plan: Partial<InsertClientPaymentPlan>): Promise<ClientPaymentPlan> {
    const [updated] = await db
      .update(clientPaymentPlans)
      .set({
        ...plan,
        updatedAt: new Date()
      })
      .where(eq(clientPaymentPlans.id, id))
      .returning();
    return updated;
  }

  async deleteClientPaymentPlan(id: string): Promise<void> {
    // First, remove the payment plan reference from any clients using it
    await db
      .update(clients)
      .set({ clientPaymentPlanId: null })
      .where(eq(clients.clientPaymentPlanId, id));

    // Then delete the payment plan
    await db
      .delete(clientPaymentPlans)
      .where(eq(clientPaymentPlans.id, id));
  }

  async assignClientPaymentPlan(clientId: string, clientPaymentPlanId: string | null): Promise<void> {
    await db
      .update(clients)
      .set({
        clientPaymentPlanId,
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId));
  }

  // Community operations
  async createCommunityGroup(group: InsertCommunityGroup): Promise<CommunityGroup> {
    const [created] = await db
      .insert(communityGroups)
      .values(group)
      .returning();
    return created;
  }

  async getCommunityGroupByTrainer(trainerId: string): Promise<CommunityGroup | undefined> {
    const [group] = await db
      .select()
      .from(communityGroups)
      .where(and(
        eq(communityGroups.trainerId, trainerId),
        eq(communityGroups.isActive, true)
      ));
    return group;
  }

  async updateCommunityGroup(id: string, updates: { name?: string; description?: string | null }): Promise<CommunityGroup> {
    const [updated] = await db
      .update(communityGroups)
      .set({ 
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        updatedAt: new Date() 
      })
      .where(eq(communityGroups.id, id))
      .returning();
    return updated;
  }

  async addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember> {
    const [created] = await db
      .insert(communityMembers)
      .values(member)
      .returning();
    return created;
  }

  async getCommunityMembers(groupId: string): Promise<string[]> {
    const members = await db
      .select({ userId: communityMembers.userId })
      .from(communityMembers)
      .where(eq(communityMembers.groupId, groupId));
    return members.map(m => m.userId);
  }

  async isCommunityMember(groupId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.groupId, groupId),
        eq(communityMembers.userId, userId)
      ));
    return !!member;
  }

  async createCommunityMessage(message: InsertCommunityMessage): Promise<CommunityMessage> {
    const [created] = await db
      .insert(communityMessages)
      .values(message)
      .returning();
    
    // Get the message with sender information
    const [messageWithSender] = await db
      .select({
        id: communityMessages.id,
        groupId: communityMessages.groupId,
        senderId: communityMessages.senderId,
        message: communityMessages.message,
        messageType: communityMessages.messageType,
        attachmentUrl: communityMessages.attachmentUrl,
        attachmentName: communityMessages.attachmentName,
        attachmentType: communityMessages.attachmentType,
        attachmentSize: communityMessages.attachmentSize,
        urlPreviewTitle: communityMessages.urlPreviewTitle,
        urlPreviewDescription: communityMessages.urlPreviewDescription,
        urlPreviewImage: communityMessages.urlPreviewImage,
        createdAt: communityMessages.createdAt,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderRole: users.role,
      })
      .from(communityMessages)
      .innerJoin(users, eq(communityMessages.senderId, users.id))
      .where(eq(communityMessages.id, created.id));
    
    return messageWithSender as any;
  }

  async getCommunityMessages(groupId: string): Promise<CommunityMessage[]> {
    const messages = await db
      .select({
        id: communityMessages.id,
        groupId: communityMessages.groupId,
        senderId: communityMessages.senderId,
        message: communityMessages.message,
        messageType: communityMessages.messageType,
        attachmentUrl: communityMessages.attachmentUrl,
        attachmentName: communityMessages.attachmentName,
        attachmentType: communityMessages.attachmentType,
        attachmentSize: communityMessages.attachmentSize,
        urlPreviewTitle: communityMessages.urlPreviewTitle,
        urlPreviewDescription: communityMessages.urlPreviewDescription,
        urlPreviewImage: communityMessages.urlPreviewImage,
        createdAt: communityMessages.createdAt,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderRole: users.role,
      })
      .from(communityMessages)
      .innerJoin(users, eq(communityMessages.senderId, users.id))
      .where(eq(communityMessages.groupId, groupId))
      .orderBy(desc(communityMessages.createdAt));
    
    return messages as any;
  }

  async isFileAssociatedWithUserCommunities(filePath: string, userId: string): Promise<boolean | undefined> {
    // Find all community messages that use this file as attachment
    const messagesWithFile = await db
      .select({
        groupId: communityMessages.groupId,
      })
      .from(communityMessages)
      .where(eq(communityMessages.attachmentUrl, filePath));

    if (messagesWithFile.length === 0) {
      // File is not associated with any community messages
      return undefined;
    }

    // Check if user is a member of any of the groups that use this file
    for (const messageGroup of messagesWithFile) {
      const isMember = await this.isCommunityMember(messageGroup.groupId, userId);
      if (isMember) {
        return true;
      }
    }

    // User is not a member of any group that uses this file
    return false;
  }

  async isSocialPostImage(imageUrl: string): Promise<boolean> {
    const [post] = await db
      .select({ id: socialPosts.id })
      .from(socialPosts)
      .where(eq(socialPosts.imageUrl, imageUrl))
      .limit(1);
    
    return !!post;
  }

  async isCommunityFile(fileUrl: string): Promise<{ groupId: string } | null> {
    const [message] = await db
      .select({ groupId: communityMessages.groupId })
      .from(communityMessages)
      .where(eq(communityMessages.attachmentUrl, fileUrl))
      .limit(1);
    
    return message || null;
  }

  // Social Posts operations
  async createSocialPost(post: InsertSocialPost): Promise<SocialPost> {
    const [created] = await db.insert(socialPosts).values(post).returning();
    return created;
  }

  async getSocialPosts(limit: number = 20, offset: number = 0): Promise<any[]> {
    const posts = await db
      .select({
        id: socialPosts.id,
        content: socialPosts.content,
        imageUrl: socialPosts.imageUrl,
        imageName: socialPosts.imageName,
        imageSize: socialPosts.imageSize,
        likesCount: socialPosts.likesCount,
        commentsCount: socialPosts.commentsCount,
        createdAt: socialPosts.createdAt,
        updatedAt: socialPosts.updatedAt,
        authorId: socialPosts.userId,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorUsername: users.username,
        authorRole: users.role,
        authorProfileImageUrl: users.profileImageUrl,
      })
      .from(socialPosts)
      .innerJoin(users, eq(socialPosts.userId, users.id))
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit)
      .offset(offset);
    
    return posts;
  }

  async getSocialPost(id: string): Promise<SocialPost | undefined> {
    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
    return post;
  }

  async updateSocialPost(id: string, post: Partial<InsertSocialPost>): Promise<SocialPost> {
    const [updated] = await db
      .update(socialPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(socialPosts.id, id))
      .returning();
    return updated;
  }

  async deleteSocialPost(id: string): Promise<void> {
    // Delete all likes and comments first
    await db.delete(socialLikes).where(eq(socialLikes.postId, id));
    await db.delete(socialComments).where(eq(socialComments.postId, id));
    
    // Delete the post
    await db.delete(socialPosts).where(eq(socialPosts.id, id));
  }

  // Social Likes operations
  async toggleSocialLike(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }> {
    // Check if user already liked this post
    const [existingLike] = await db
      .select()
      .from(socialLikes)
      .where(and(eq(socialLikes.userId, userId), eq(socialLikes.postId, postId)));

    let liked: boolean;

    if (existingLike) {
      // Unlike the post
      await db
        .delete(socialLikes)
        .where(and(eq(socialLikes.userId, userId), eq(socialLikes.postId, postId)));
      liked = false;
    } else {
      // Like the post
      await db.insert(socialLikes).values({ userId, postId });
      liked = true;
    }

    // Update likes count on the post
    const [countResult] = await db
      .select({ count: count() })
      .from(socialLikes)
      .where(eq(socialLikes.postId, postId));

    const likesCount = countResult?.count || 0;

    await db
      .update(socialPosts)
      .set({ likesCount })
      .where(eq(socialPosts.id, postId));

    return { liked, likesCount };
  }

  async getSocialPostLikes(postId: string): Promise<SocialLike[]> {
    return await db.select().from(socialLikes).where(eq(socialLikes.postId, postId));
  }

  // Social Comments operations
  async createSocialComment(comment: InsertSocialComment): Promise<SocialComment> {
    const [created] = await db.insert(socialComments).values(comment).returning();

    // Update comments count on the post
    const [countResult] = await db
      .select({ count: count() })
      .from(socialComments)
      .where(eq(socialComments.postId, comment.postId));

    const commentsCount = countResult?.count || 0;

    await db
      .update(socialPosts)
      .set({ commentsCount })
      .where(eq(socialPosts.id, comment.postId));

    return created;
  }

  async getSocialPostComments(postId: string): Promise<any[]> {
    const comments = await db
      .select({
        id: socialComments.id,
        content: socialComments.content,
        createdAt: socialComments.createdAt,
        updatedAt: socialComments.updatedAt,
        postId: socialComments.postId,
        authorId: socialComments.userId,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorUsername: users.username,
        authorRole: users.role,
        authorProfileImageUrl: users.profileImageUrl,
      })
      .from(socialComments)
      .innerJoin(users, eq(socialComments.userId, users.id))
      .where(eq(socialComments.postId, postId))
      .orderBy(socialComments.createdAt);
    
    return comments;
  }

  async updateSocialComment(id: string, comment: Partial<InsertSocialComment>): Promise<SocialComment> {
    const [updated] = await db
      .update(socialComments)
      .set({ ...comment, updatedAt: new Date() })
      .where(eq(socialComments.id, id))
      .returning();
    return updated;
  }

  async deleteSocialComment(id: string): Promise<void> {
    // Get the comment to find the postId
    const [comment] = await db.select().from(socialComments).where(eq(socialComments.id, id));
    
    if (comment) {
      // Delete the comment
      await db.delete(socialComments).where(eq(socialComments.id, id));

      // Update comments count on the post
      const [countResult] = await db
        .select({ count: count() })
        .from(socialComments)
        .where(eq(socialComments.postId, comment.postId));

      const commentsCount = countResult?.count || 0;

      await db
        .update(socialPosts)
        .set({ commentsCount })
        .where(eq(socialPosts.id, comment.postId));
    }
  }

  // System Settings operations
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting;
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  async upsertSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const existing = await this.getSystemSetting(setting.key);
    
    if (existing) {
      const [updated] = await db
        .update(systemSettings)
        .set({ ...setting, updatedAt: new Date() })
        .where(eq(systemSettings.key, setting.key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemSettings)
        .values(setting)
        .returning();
      return created;
    }
  }

  async updateSystemSetting(key: string, value: boolean, updatedBy?: string): Promise<SystemSetting> {
    const updateData: any = { value, updatedAt: new Date() };
    if (updatedBy) {
      updateData.updatedBy = updatedBy;
    }

    const [updated] = await db
      .update(systemSettings)
      .set(updateData)
      .where(eq(systemSettings.key, key))
      .returning();
    
    if (!updated) {
      // If the setting doesn't exist, create it
      const [created] = await db
        .insert(systemSettings)
        .values({ key, value, updatedBy })
        .returning();
      return created;
    }
    
    return updated;
  }
}

export const storage = new DatabaseStorage();
