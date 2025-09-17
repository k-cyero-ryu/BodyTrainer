import fetch from 'node-fetch';

// USDA FoodData Central API configuration
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const USDA_API_KEY = process.env.USDA_API_KEY;

// Rate limiting configuration
const RATE_LIMIT_DELAY = 100; // 100ms between requests
let lastRequestTime = 0;

// USDA API response interfaces
export interface USDASearchResult {
  fdcId: number;
  description: string;
  brandOwner?: string;
  ingredients?: string;
  dataType: string;
  foodCategory?: string;
}

export interface USDASearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDASearchResult[];
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDAFoodDetail {
  fdcId: number;
  description: string;
  brandOwner?: string;
  ingredients?: string;
  dataType: string;
  foodCategory?: string;
  foodNutrients: USDANutrient[];
}

// Standardized nutrition data format
export interface NutritionData {
  fdcId: number;
  name: string;
  brandOwner?: string;
  category?: string;
  calories?: number;
  protein?: number; // grams
  carbs?: number; // grams
  totalFat?: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // milligrams
  servingSize?: number; // grams (usually 100g)
  servingUnit?: string;
}

// Rate limiting helper
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
}

// Generic USDA API request handler
async function makeUSDARequest(endpoint: string): Promise<any> {
  if (!USDA_API_KEY) {
    throw new Error('USDA API key is required but not configured');
  }

  await rateLimit();

  const url = `${USDA_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${USDA_API_KEY}`;
  
  try {
    console.log(`Making USDA API request to: ${endpoint}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`USDA API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`USDA API response received for: ${endpoint}`);
    return data;
  } catch (error: any) {
    console.error('USDA API request error:', error);
    throw new Error(`Failed to fetch data from USDA API: ${error.message || 'Unknown error'}`);
  }
}

// Search for foods in USDA database
export async function searchFoods(query: string, pageSize: number = 10, pageNumber: number = 1): Promise<USDASearchResponse> {
  if (!query.trim()) {
    throw new Error('Search query is required');
  }

  const endpoint = `/foods/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}&pageNumber=${pageNumber}&dataType=Foundation,SR Legacy,Survey (FNDDS),Branded`;
  
  try {
    const response = await makeUSDARequest(endpoint);
    return {
      totalHits: response.totalHits || 0,
      currentPage: response.currentPage || 1,
      totalPages: response.totalPages || 1,
      foods: response.foods || []
    };
  } catch (error) {
    console.error('Error searching foods:', error);
    throw error;
  }
}

// Get detailed food information by FDC ID
export async function getFoodDetails(fdcId: number): Promise<USDAFoodDetail> {
  if (!fdcId || fdcId <= 0) {
    throw new Error('Valid FDC ID is required');
  }

  const endpoint = `/food/${fdcId}`;
  
  try {
    const response = await makeUSDARequest(endpoint);
    return response;
  } catch (error) {
    console.error(`Error getting food details for FDC ID ${fdcId}:`, error);
    throw error;
  }
}

// Extract nutrition data from USDA food details
export function parseNutritionData(foodDetail: USDAFoodDetail): NutritionData {
  const nutrients = foodDetail.foodNutrients || [];
  
  // Nutrient ID mappings based on USDA FoodData Central
  const findNutrientByNumber = (numbers: string[]): USDANutrient | undefined => {
    return nutrients.find(n => numbers.includes(n.nutrientNumber));
  };

  // Energy (calories) - nutrient numbers: 208
  const energyNutrient = findNutrientByNumber(['208']);
  
  // Protein - nutrient numbers: 203
  const proteinNutrient = findNutrientByNumber(['203']);
  
  // Carbohydrates - nutrient numbers: 205
  const carbsNutrient = findNutrientByNumber(['205']);
  
  // Total fat - nutrient numbers: 204
  const fatNutrient = findNutrientByNumber(['204']);
  
  // Fiber - nutrient numbers: 291
  const fiberNutrient = findNutrientByNumber(['291']);
  
  // Sugar - nutrient numbers: 269 (total sugars)
  const sugarNutrient = findNutrientByNumber(['269']);
  
  // Sodium - nutrient numbers: 307
  const sodiumNutrient = findNutrientByNumber(['307']);

  return {
    fdcId: foodDetail.fdcId,
    name: foodDetail.description,
    brandOwner: foodDetail.brandOwner,
    category: foodDetail.foodCategory,
    calories: energyNutrient ? Math.round(energyNutrient.value) : undefined,
    protein: proteinNutrient ? Math.round(proteinNutrient.value * 100) / 100 : undefined,
    carbs: carbsNutrient ? Math.round(carbsNutrient.value * 100) / 100 : undefined,
    totalFat: fatNutrient ? Math.round(fatNutrient.value * 100) / 100 : undefined,
    fiber: fiberNutrient ? Math.round(fiberNutrient.value * 100) / 100 : undefined,
    sugar: sugarNutrient ? Math.round(sugarNutrient.value * 100) / 100 : undefined,
    sodium: sodiumNutrient ? Math.round(sodiumNutrient.value) : undefined,
    servingSize: 100, // USDA data is typically per 100g
    servingUnit: 'g'
  };
}

// Get nutrition data for a food item
export async function getFoodNutrition(fdcId: number): Promise<NutritionData> {
  try {
    const foodDetail = await getFoodDetails(fdcId);
    return parseNutritionData(foodDetail);
  } catch (error: any) {
    console.error(`Error getting nutrition data for FDC ID ${fdcId}:`, error);
    throw error;
  }
}

// Health check for USDA API service
export async function checkUSDAApiHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    if (!USDA_API_KEY) {
      return {
        healthy: false,
        message: 'USDA API key is not configured'
      };
    }
    
    // Try a simple search to verify API connectivity
    await searchFoods('apple', 1);
    
    return {
      healthy: true,
      message: 'USDA API service is healthy'
    };
  } catch (error) {
    return {
      healthy: false,
      message: `USDA API service error: ${error.message}`
    };
  }
}