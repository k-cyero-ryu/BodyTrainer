import { Router } from 'express';
import { db } from './db';
import { storage } from './storage';
import { 
  insertMealPlanSchema,
  insertMealDaySchema, 
  insertMealSchema,
  insertMealItemSchema,
  insertSupplementPlanSchema,
  insertSupplementItemSchema,
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

// Get meal plans by client
nutritionRouter.get('/clients/:clientId/meal-plans', async (req, res) => {
  try {
    const plans = await storage.getMealPlansByClient(req.params.clientId);
    res.json(plans);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get meal plans by trainer
nutritionRouter.get('/trainers/:trainerId/meal-plans', async (req, res) => {
  try {
    const plans = await storage.getMealPlansByTrainer(req.params.trainerId);
    res.json(plans);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get active meal plan for a client
nutritionRouter.get('/clients/:clientId/meal-plans/active', async (req, res) => {
  try {
    const plan = await storage.getActiveMealPlan(req.params.clientId);
    res.json(plan || null);
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

// ============== Supplement Plan Routes ==============

// Create supplement plan
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

// Get supplement plans by client
nutritionRouter.get('/clients/:clientId/supplement-plans', async (req, res) => {
  try {
    const plans = await storage.getSupplementPlansByClient(req.params.clientId);
    res.json(plans);
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

// Get active supplement plan for a client
nutritionRouter.get('/clients/:clientId/supplement-plans/active', async (req, res) => {
  try {
    const plan = await storage.getActiveSupplementPlan(req.params.clientId);
    res.json(plan || null);
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

// ============== Supplement Item Routes ==============

// Create supplement item
nutritionRouter.post('/supplement-items', async (req, res) => {
  try {
    const itemData = insertSupplementItemSchema.parse(req.body);
    const item = await storage.createSupplementItem(itemData);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get supplement items by plan
nutritionRouter.get('/supplement-plans/:planId/items', async (req, res) => {
  try {
    const items = await storage.getSupplementItemsByPlan(req.params.planId);
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
