/**
 * Nutrition Calculator Service
 * Implements BMR and TDEE calculations using the Mifflin-St Jeor equation
 */

export interface BMRInput {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'male' | 'female';
}

export interface TDEEInput extends BMRInput {
  activityLevel: string;
}

export interface MacroDistribution {
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface MacroPercentages {
  protein: number; // percentage (0-1)
  carbs: number; // percentage (0-1)
  fat: number; // percentage (0-1)
}

// Activity level multipliers based on research
// Supports both frontend values (sedentary, light, moderate, active, very_active)
// and PRD values (lightly_active, moderately_active, extra_active) for compatibility
export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  // Frontend values (currently in use)
  'sedentary': 1.2,              // Little or no exercise
  'light': 1.375,                // Light exercise 1-3 days/week
  'moderate': 1.55,              // Moderate exercise 3-5 days/week  
  'active': 1.725,               // Hard exercise 6-7 days/week
  'very_active': 1.9,            // Very hard exercise, physical job
  
  // PRD/alternative values (for compatibility)
  'lightly_active': 1.375,       // Same as 'light'
  'moderately_active': 1.55,     // Same as 'moderate'
  'extra_active': 1.9,           // Same as 'very_active'
};

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
 * 
 * For men: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) + 5
 * For women: BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age) − 161
 */
export function calculateBMR({ weight, height, age, gender }: BMRInput): number {
  if (!weight || !height || !age || !gender) {
    throw new Error('Missing required parameters for BMR calculation');
  }

  if (weight <= 0 || height <= 0 || age <= 0) {
    throw new Error('Invalid values for BMR calculation');
  }

  const baseCalc = (10 * weight) + (6.25 * height) - (5 * age);
  const bmr = gender === 'male' ? baseCalc + 5 : baseCalc - 161;
  
  return Math.round(bmr);
}

/**
 * Calculate Total Daily Energy Expenditure
 * TDEE = BMR × Activity Factor
 */
export function calculateTDEE(input: TDEEInput): number {
  const bmr = calculateBMR(input);
  const multiplier = ACTIVITY_MULTIPLIERS[input.activityLevel] || ACTIVITY_MULTIPLIERS['moderate'];
  const tdee = bmr * multiplier;
  
  return Math.round(tdee);
}

/**
 * Calculate macronutrients in grams based on total calories
 * 
 * Default distribution:
 * - Protein: 30% (4 cal/g)
 * - Carbs: 40% (4 cal/g)
 * - Fat: 30% (9 cal/g)
 */
export function calculateMacros(
  calories: number, 
  distribution: MacroPercentages = { protein: 0.3, carbs: 0.4, fat: 0.3 }
): MacroDistribution {
  if (calories <= 0) {
    throw new Error('Calories must be greater than 0');
  }

  // Validate percentages sum to 1
  const sum = distribution.protein + distribution.carbs + distribution.fat;
  if (Math.abs(sum - 1) > 0.01) {
    throw new Error('Macro percentages must sum to 1 (100%)');
  }

  return {
    protein: Math.round((calories * distribution.protein) / 4), // 4 cal per gram
    carbs: Math.round((calories * distribution.carbs) / 4),     // 4 cal per gram
    fat: Math.round((calories * distribution.fat) / 9),         // 9 cal per gram
  };
}

/**
 * Get recommended macro distribution based on fitness goal
 */
export function getRecommendedMacroDistribution(goal: string): MacroPercentages {
  const distributions: Record<string, MacroPercentages> = {
    'weight_loss': { protein: 0.35, carbs: 0.30, fat: 0.35 },      // High protein, moderate carbs
    'muscle_gain': { protein: 0.30, carbs: 0.45, fat: 0.25 },      // Higher carbs for energy
    'maintenance': { protein: 0.30, carbs: 0.40, fat: 0.30 },      // Balanced
    'endurance': { protein: 0.25, carbs: 0.50, fat: 0.25 },        // Higher carbs
    'strength': { protein: 0.35, carbs: 0.35, fat: 0.30 },         // High protein
  };

  return distributions[goal] || distributions['maintenance'];
}

/**
 * Calculate calorie deficit/surplus for weight goals
 */
export function calculateCaloricAdjustment(
  tdee: number,
  weightGoal: 'loss' | 'gain' | 'maintain',
  rate: 'slow' | 'moderate' | 'fast' = 'moderate'
): number {
  const adjustments = {
    loss: { slow: -250, moderate: -500, fast: -750 },
    gain: { slow: 250, moderate: 500, fast: 750 },
    maintain: { slow: 0, moderate: 0, fast: 0 },
  };

  return tdee + (adjustments[weightGoal][rate] || 0);
}

/**
 * Validate client data for nutrition calculations
 */
export function validateNutritionData(data: Partial<BMRInput>): {
  valid: boolean;
  missingFields: string[];
} {
  const requiredFields = ['weight', 'height', 'age', 'gender'];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!data[field as keyof BMRInput]) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
