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

// Curated list of popular foods with their USDA FDC IDs
interface CuratedFood {
  fdcId: number;
  name: string;
  category: string;
  commonNames: string[]; // Alternative names for search
}

const CURATED_FOODS: CuratedFood[] = [
  // Proteins
  { fdcId: 173304, name: "Chicken, broilers or fryers, breast, meat only, cooked, roasted", category: "proteins", commonNames: ["Chicken breast", "Pollo", "Chicken"] },
  { fdcId: 174292, name: "Beef, round, eye of round, separable lean only, trimmed to 0\" fat, choice, cooked, roasted", category: "proteins", commonNames: ["Beef", "Res", "Beef roast"] },
  { fdcId: 175167, name: "Fish, salmon, Atlantic, farmed, cooked, dry heat", category: "proteins", commonNames: ["Salmon", "Pescado", "Fish"] },
  { fdcId: 173423, name: "Pork, fresh, loin, center cut (chops), bone-in, separable lean only, cooked, broiled", category: "proteins", commonNames: ["Pork", "Cerdo", "Pork chop"] },
  { fdcId: 321355, name: "Egg, whole, cooked, hard-boiled", category: "proteins", commonNames: ["Egg", "Huevo", "Hard boiled egg"] },
  { fdcId: 175177, name: "Fish, tuna, light, canned in water, drained solids", category: "proteins", commonNames: ["Tuna", "Atún", "Canned tuna"] },
  
  // Carbohydrates  
  { fdcId: 169704, name: "Rice, white, long-grain, regular, cooked", category: "carbohydrates", commonNames: ["White rice", "Arroz", "Rice"] },
  { fdcId: 168878, name: "Bread, whole-wheat, commercially prepared", category: "carbohydrates", commonNames: ["Whole wheat bread", "Pan integral", "Bread"] },
  { fdcId: 168916, name: "Pasta, cooked, enriched, without added salt", category: "carbohydrates", commonNames: ["Pasta", "Noodles", "Spaghetti"] },
  { fdcId: 169998, name: "Potatoes, flesh and skin, raw", category: "carbohydrates", commonNames: ["Potato", "Papa", "Patata"] },
  { fdcId: 168927, name: "Oats", category: "carbohydrates", commonNames: ["Oats", "Avena", "Oatmeal"] },
  { fdcId: 170066, name: "Sweet potato, raw", category: "carbohydrates", commonNames: ["Sweet potato", "Batata", "Camote"] },
  
  // Fruits
  { fdcId: 171688, name: "Apples, raw, with skin", category: "fruits", commonNames: ["Apple", "Manzana"] },
  { fdcId: 171713, name: "Bananas, raw", category: "fruits", commonNames: ["Banana", "Plátano", "Banano"] },
  { fdcId: 167765, name: "Orange, raw", category: "fruits", commonNames: ["Orange", "Naranja"] },
  { fdcId: 167757, name: "Grapes, red or green (European type, such as Thompson seedless), raw", category: "fruits", commonNames: ["Grapes", "Uvas"] },
  { fdcId: 167762, name: "Strawberries, raw", category: "fruits", commonNames: ["Strawberries", "Fresas"] },
  { fdcId: 171716, name: "Blueberries, raw", category: "fruits", commonNames: ["Blueberries", "Arándanos"] },
  
  // Vegetables
  { fdcId: 170393, name: "Broccoli, raw", category: "vegetables", commonNames: ["Broccoli", "Brócoli"] },
  { fdcId: 169967, name: "Spinach, raw", category: "vegetables", commonNames: ["Spinach", "Espinacas"] },
  { fdcId: 169998, name: "Carrots, raw", category: "vegetables", commonNames: ["Carrots", "Zanahorias"] },
  { fdcId: 170457, name: "Tomatoes, red, ripe, raw, year round average", category: "vegetables", commonNames: ["Tomatoes", "Tomates"] },
  { fdcId: 169260, name: "Onions, raw", category: "vegetables", commonNames: ["Onions", "Cebollas"] },
  { fdcId: 170417, name: "Lettuce, cos or romaine, raw", category: "vegetables", commonNames: ["Lettuce", "Lechuga"] },
  
  // Dairy
  { fdcId: 171256, name: "Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D", category: "dairy", commonNames: ["Milk 2%", "Leche", "Milk"] },
  { fdcId: 173441, name: "Cheese, cheddar", category: "dairy", commonNames: ["Cheddar cheese", "Queso", "Cheese"] },
  { fdcId: 171284, name: "Yogurt, plain, whole milk", category: "dairy", commonNames: ["Yogurt", "Yogur"] },
  
  // Healthy fats
  { fdcId: 171705, name: "Avocados, raw, all commercial varieties", category: "fats", commonNames: ["Avocado", "Aguacate", "Palta"] },
  { fdcId: 170178, name: "Nuts, almonds", category: "fats", commonNames: ["Almonds", "Almendras"] },
  { fdcId: 170187, name: "Oil, olive, salad or cooking", category: "fats", commonNames: ["Olive oil", "Aceite de oliva"] },
  
  // Legumes
  { fdcId: 173757, name: "Beans, black, mature seeds, cooked, boiled, without salt", category: "legumes", commonNames: ["Black beans", "Frijoles negros"] },
  { fdcId: 174270, name: "Lentils, mature seeds, cooked, boiled, without salt", category: "legumes", commonNames: ["Lentils", "Lentejas"] },
  { fdcId: 174308, name: "Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt", category: "legumes", commonNames: ["Chickpeas", "Garbanzos"] }
];

// Get curated foods list with nutrition data
export async function getCuratedFoods(): Promise<NutritionData[]> {
  try {
    const nutritionPromises = CURATED_FOODS.map(async (food) => {
      try {
        const nutrition = await getFoodNutrition(food.fdcId);
        return {
          ...nutrition,
          name: food.name,
          category: food.category,
          commonNames: food.commonNames
        } as NutritionData & { commonNames: string[] };
      } catch (error) {
        console.warn(`Failed to get nutrition for ${food.name} (${food.fdcId}):`, error);
        return null;
      }
    });

    const results = await Promise.all(nutritionPromises);
    return results.filter(Boolean) as NutritionData[];
  } catch (error) {
    console.error('Error getting curated foods:', error);
    throw error;
  }
}

// Search curated foods by name or common names
export function searchCuratedFoods(query: string): CuratedFood[] {
  if (!query.trim()) {
    return CURATED_FOODS;
  }

  const searchTerm = query.toLowerCase();
  return CURATED_FOODS.filter(food => 
    food.name.toLowerCase().includes(searchTerm) ||
    food.commonNames.some(name => name.toLowerCase().includes(searchTerm))
  );
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