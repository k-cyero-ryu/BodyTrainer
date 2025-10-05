import type { Client } from "@shared/schema";

// Activity level multipliers for TDEE calculation
export const ACTIVITY_LEVELS = {
  sedentary: {
    multiplier: 1.2,
    key: 'sedentary',
    translationKey: 'tdee.activityLevels.sedentary'
  },
  light: {
    multiplier: 1.375,
    key: 'light',
    translationKey: 'tdee.activityLevels.light'
  },
  moderate: {
    multiplier: 1.55,
    key: 'moderate',
    translationKey: 'tdee.activityLevels.moderate'
  },
  active: {
    multiplier: 1.725,
    key: 'active',
    translationKey: 'tdee.activityLevels.active'
  },
  veryActive: {
    multiplier: 1.9,
    key: 'veryActive',
    translationKey: 'tdee.activityLevels.veryActive'
  }
} as const;

export type ActivityLevelKey = keyof typeof ACTIVITY_LEVELS;

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
 * BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + s
 * where s = +5 for males and -161 for females
 */
export function calculateBMR(
  weight: number, // in kg
  height: number, // in cm
  age: number,
  gender: 'male' | 'female'
): number {
  const genderConstant = gender === 'male' ? 5 : -161;
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + genderConstant;
  return Math.round(bmr);
}

/**
 * Calculate Total Daily Energy Expenditure
 * TDEE = BMR × Activity Level Multiplier
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: string
): number {
  // Normalize activity level to match our keys
  const normalizedLevel = activityLevel.toLowerCase().replace(/[\s-_]/g, '') as ActivityLevelKey;
  
  // Map common variations
  const levelMap: Record<string, ActivityLevelKey> = {
    'sedentary': 'sedentary',
    'lightlyactive': 'light',
    'light': 'light',
    'moderate': 'moderate',
    'moderatelyactive': 'moderate',
    'active': 'active',
    'veryactive': 'veryActive',
    'extremelyactive': 'veryActive'
  };
  
  const mappedLevel = levelMap[normalizedLevel] || 'moderate';
  const multiplier = ACTIVITY_LEVELS[mappedLevel].multiplier;
  
  return Math.round(bmr * multiplier);
}

/**
 * Calculate TDEE from client data
 */
export function calculateTDEEFromClient(client: Client): {
  bmr: number;
  tdee: number;
  activityLevel: string;
} | null {
  // Validate required fields
  if (!client.weight || !client.height || !client.age || !client.gender) {
    return null;
  }

  const weight = typeof client.weight === 'string' ? parseFloat(client.weight) : client.weight;
  const height = typeof client.height === 'string' ? parseFloat(client.height) : client.height;
  const age = client.age;
  const gender = client.gender;
  const activityLevel = client.activityLevel || 'moderate';

  // Validate parsed values
  if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0 || age <= 0) {
    return null;
  }

  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);

  return {
    bmr,
    tdee,
    activityLevel
  };
}

/**
 * Apply adjustment percentage to calories
 */
export function applyAdjustment(baseCalories: number, adjustmentPercentage: number): number {
  const adjustment = (baseCalories * adjustmentPercentage) / 100;
  return Math.round(baseCalories + adjustment);
}
