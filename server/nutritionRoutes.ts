import { Router } from 'express';
import { db } from './db';
import { storage } from './storage';
import { 
  insertMealPlanSchema,
  insertMealPlanAssignmentSchema,
  insertMealDaySchema, 
  insertMealSchema,
  insertMealItemSchema,
  insertSupplementPlanSchema,
  insertSupplementItemSchema,
  insertSupplementPlanItemSchema,
  insertSupplementPlanAssignmentSchema,
  insertUsdaFoodCacheSchema,
} from '@shared/schema';
import { calculateTDEE, type TDEEInput } from './nutritionCalculator';

export const nutritionRouter = Router();

// ============== USDA Food Cache Routes ==============

// Cache a USDA food item
nutritionRouter.post('/usda-foods', async (req, res) => {
  try {
    const foodData = insertUsdaFoodCacheSchema.parse(req.body);
    
    // Check if already cached
    const existing = await storage.getUsdaFoodByFdcId(foodData.fdcId);
    if (existing) {
      // Update last used timestamp
      await storage.updateUsdaFoodLastUsed(foodData.fdcId);
      return res.json(existing);
    }
    
    const cached = await storage.cacheUsdaFood(foodData);
    res.json(cached);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get cached USDA food by FDC ID
nutritionRouter.get('/usda-foods/:fdcId', async (req, res) => {
  try {
    const food = await storage.getUsdaFoodByFdcId(req.params.fdcId);
    if (!food) {
      return res.status(404).json({ error: 'Food not found in cache' });
    }
    res.json(food);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============== TDEE Calculation Route ==============

nutritionRouter.post('/calculate-tdee', async (req, res) => {
  try {
    const { weight, height, age, gender, activityLevel } = req.body as TDEEInput;
    
    if (!weight || !height || !age || !gender || !activityLevel) {
      return res.status(400).json({ 
        error: 'Missing required fields: weight, height, age, gender, activityLevel' 
      });
    }
    
    const tdee = calculateTDEE({ weight, height, age, gender, activityLevel });
    res.json({ tdee });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============== Meal Plan Routes ==============

// Create meal plan
nutritionRouter.post('/meal-plans', async (req, res) => {
  try {
    const planData = insertMealPlanSchema.parse(req.body);
    const plan = await storage.createMealPlan(planData);
    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get meal plan by ID
nutritionRouter.get('/meal-plans/:id', async (req, res) => {
  try {
    const plan = await storage.getMealPlan(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }
    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get meal plan templates by trainer
nutritionRouter.get('/trainers/:trainerId/meal-plans', async (req, res) => {
  try {
    const plans = await storage.getMealPlansByTrainer(req.params.trainerId);
    res.json(plans);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============== Meal Plan Assignment Routes ==============

// Create meal plan assignment (assign template to client)
nutritionRouter.post('/meal-plan-assignments', async (req, res) => {
  try {
    // Convert date strings to Date objects before validation
    const body = {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    };
    const assignmentData = insertMealPlanAssignmentSchema.parse(body);
    
    // Replace any existing meal plan assignment (deletes old assignments)
    const assignment = await storage.replaceMealPlanAssignment(assignmentData);
    res.json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get meal plan assignment by ID
nutritionRouter.get('/meal-plan-assignments/:id', async (req, res) => {
  try {
    const assignment = await storage.getMealPlanAssignment(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get meal plan assignments for a client
nutritionRouter.get('/clients/:clientId/meal-plan-assignments', async (req, res) => {
  try {
    const assignments = await storage.getMealPlanAssignmentsByClient(req.params.clientId);
    res.json(assignments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get active meal plan assignment for a client
nutritionRouter.get('/clients/:clientId/meal-plan-assignments/active', async (req, res) => {
  try {
    const assignment = await storage.getActiveMealPlanAssignment(req.params.clientId);
    if (!assignment) {
      return res.json(null);
    }
    
    // Get full meal plan details
    const mealPlan = await storage.getMealPlan(assignment.mealPlanId);
    res.json({
      ...assignment,
      mealPlan
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get meal plan assignments for a specific plan
nutritionRouter.get('/meal-plans/:planId/assignments', async (req, res) => {
  try {
    const assignments = await storage.getMealPlanAssignmentsByPlan(req.params.planId);
    res.json(assignments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get active meal plan assignment for a client
nutritionRouter.get('/clients/:clientId/active-meal-plan-assignment', async (req, res) => {
  try {
    const assignment = await storage.getActiveMealPlanAssignment(req.params.clientId);
    res.json(assignment || null);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update meal plan assignment
nutritionRouter.put('/meal-plan-assignments/:id', async (req, res) => {
  try {
    const assignmentData = insertMealPlanAssignmentSchema.partial().parse(req.body);
    const updated = await storage.updateMealPlanAssignment(req.params.id, assignmentData);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete meal plan assignment
nutritionRouter.delete('/meal-plan-assignments/:id', async (req, res) => {
  try {
    await storage.deleteMealPlanAssignment(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update meal plan
nutritionRouter.patch('/meal-plans/:id', async (req, res) => {
  try {
    const updates = insertMealPlanSchema.partial().parse(req.body);
    const updated = await storage.updateMealPlan(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete meal plan
nutritionRouter.delete('/meal-plans/:id', async (req, res) => {
  try {
    await storage.deleteMealPlan(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============== Meal Day Routes ==============

// Create meal day
nutritionRouter.post('/meal-days', async (req, res) => {
  try {
    const dayData = insertMealDaySchema.parse(req.body);
    const day = await storage.createMealDay(dayData);
    res.json(day);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get meal days by plan
nutritionRouter.get('/meal-plans/:planId/days', async (req, res) => {
  try {
    const days = await storage.getMealDaysByPlan(req.params.planId);
    res.json(days);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update meal day
nutritionRouter.patch('/meal-days/:id', async (req, res) => {
  try {
    const updates = insertMealDaySchema.partial().parse(req.body);
    const updated = await storage.updateMealDay(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete meal day
nutritionRouter.delete('/meal-days/:id', async (req, res) => {
  try {
    await storage.deleteMealDay(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============== Meal Routes ==============

// Create meal
nutritionRouter.post('/meals', async (req, res) => {
  try {
    const mealData = insertMealSchema.parse(req.body);
    const meal = await storage.createMeal(mealData);
    res.json(meal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get meals by day
nutritionRouter.get('/meal-days/:dayId/meals', async (req, res) => {
  try {
    const meals = await storage.getMealsByDay(req.params.dayId);
    res.json(meals);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update meal
nutritionRouter.patch('/meals/:id', async (req, res) => {
  try {
    const updates = insertMealSchema.partial().parse(req.body);
    const updated = await storage.updateMeal(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete meal
nutritionRouter.delete('/meals/:id', async (req, res) => {
  try {
    await storage.deleteMeal(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============== Meal Item Routes ==============

// Create meal item
nutritionRouter.post('/meal-items', async (req, res) => {
  try {
    const itemData = insertMealItemSchema.parse(req.body);
    const item = await storage.createMealItem(itemData);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get meal items by meal
nutritionRouter.get('/meals/:mealId/items', async (req, res) => {
  try {
    const items = await storage.getMealItemsByMeal(req.params.mealId);
    res.json(items);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update meal item
nutritionRouter.patch('/meal-items/:id', async (req, res) => {
  try {
    const updates = insertMealItemSchema.partial().parse(req.body);
    const updated = await storage.updateMealItem(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete meal item
nutritionRouter.delete('/meal-items/:id', async (req, res) => {
  try {
    await storage.deleteMealItem(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============== Supplement Item Library Routes (Trainer-owned) ==============

// Create supplement item in library
nutritionRouter.post('/supplement-items', async (req, res) => {
  try {
    const itemData = insertSupplementItemSchema.parse(req.body);
    const item = await storage.createSupplementItem(itemData);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get supplement item by ID
nutritionRouter.get('/supplement-items/:id', async (req, res) => {
  try {
    const item = await storage.getSupplementItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Supplement item not found' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get supplement items by trainer
nutritionRouter.get('/trainers/:trainerId/supplement-items', async (req, res) => {
  try {
    const items = await storage.getSupplementItemsByTrainer(req.params.trainerId);
    res.json(items);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update supplement item
nutritionRouter.patch('/supplement-items/:id', async (req, res) => {
  try {
    const updates = insertSupplementItemSchema.partial().parse(req.body);
    const updated = await storage.updateSupplementItem(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete supplement item
nutritionRouter.delete('/supplement-items/:id', async (req, res) => {
  try {
    await storage.deleteSupplementItem(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============== Supplement Plan Template Routes ==============

// Create supplement plan template
nutritionRouter.post('/supplement-plans', async (req, res) => {
  try {
    const planData = insertSupplementPlanSchema.parse(req.body);
    const plan = await storage.createSupplementPlan(planData);
    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get supplement plan by ID
nutritionRouter.get('/supplement-plans/:id', async (req, res) => {
  try {
    const plan = await storage.getSupplementPlan(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Supplement plan not found' });
    }
    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get supplement plans by trainer
nutritionRouter.get('/trainers/:trainerId/supplement-plans', async (req, res) => {
  try {
    const plans = await storage.getSupplementPlansByTrainer(req.params.trainerId);
    res.json(plans);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update supplement plan
nutritionRouter.patch('/supplement-plans/:id', async (req, res) => {
  try {
    const updates = insertSupplementPlanSchema.partial().parse(req.body);
    const updated = await storage.updateSupplementPlan(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete supplement plan
nutritionRouter.delete('/supplement-plans/:id', async (req, res) => {
  try {
    await storage.deleteSupplementPlan(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============== Supplement Plan Item Routes (Junction) ==============

// Add supplement item to plan
nutritionRouter.post('/supplement-plan-items', async (req, res) => {
  try {
    const itemData = insertSupplementPlanItemSchema.parse(req.body);
    const item = await storage.createSupplementPlanItem(itemData);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get supplement plan items by plan
nutritionRouter.get('/supplement-plans/:planId/items', async (req, res) => {
  try {
    const items = await storage.getSupplementPlanItemsByPlan(req.params.planId);
    res.json(items);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update supplement plan item
nutritionRouter.patch('/supplement-plan-items/:id', async (req, res) => {
  try {
    const updates = insertSupplementPlanItemSchema.partial().parse(req.body);
    const updated = await storage.updateSupplementPlanItem(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete supplement plan item
nutritionRouter.delete('/supplement-plan-items/:id', async (req, res) => {
  try {
    await storage.deleteSupplementPlanItem(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============== Supplement Plan Assignment Routes ==============

// Assign supplement plan to client
nutritionRouter.post('/supplement-plan-assignments', async (req, res) => {
  try {
    // Convert date strings to Date objects before validation
    const body = {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    };
    const assignmentData = insertSupplementPlanAssignmentSchema.parse(body);
    
    // Replace any existing supplement plan assignment (deletes old assignments)
    const assignment = await storage.replaceSupplementPlanAssignment(assignmentData);
    res.json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get supplement plan assignment by ID
nutritionRouter.get('/supplement-plan-assignments/:id', async (req, res) => {
  try {
    const assignment = await storage.getSupplementPlanAssignment(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get supplement plan assignments by client
nutritionRouter.get('/clients/:clientId/supplement-plan-assignments', async (req, res) => {
  try {
    const assignments = await storage.getSupplementPlanAssignmentsByClient(req.params.clientId);
    res.json(assignments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get active supplement plan assignment for a client
nutritionRouter.get('/clients/:clientId/supplement-plan-assignments/active', async (req, res) => {
  try {
    const assignment = await storage.getActiveSupplementPlanAssignment(req.params.clientId);
    if (!assignment) {
      return res.json(null);
    }
    
    // Get full supplement plan details
    const supplementPlan = await storage.getSupplementPlan(assignment.supplementPlanId);
    res.json({
      ...assignment,
      supplementPlan
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update supplement plan assignment
nutritionRouter.patch('/supplement-plan-assignments/:id', async (req, res) => {
  try {
    const updates = insertSupplementPlanAssignmentSchema.partial().parse(req.body);
    const updated = await storage.updateSupplementPlanAssignment(req.params.id, updates);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete supplement plan assignment
nutritionRouter.delete('/supplement-plan-assignments/:id', async (req, res) => {
  try {
    await storage.deleteSupplementPlanAssignment(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
