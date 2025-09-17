import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Loader2, 
  Calculator, 
  Utensils,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";
import type { USDASearchResponse, USDASearchResult, NutritionData } from "@shared/schema";

interface AutoCalorieCalculatorProps {
  foodDescription: string;
  quantity: number; // in grams
  onCaloriesCalculated: (calories: number, fdcId?: number, nutritionData?: NutritionData) => void;
  onFoodMatched?: (matchedFood: USDASearchResult) => void;
  disabled?: boolean;
}

// Smart food name mappings for common translations/aliases
const FOOD_NAME_MAPPINGS: Record<string, string> = {
  // Spanish to English
  'pollo': 'chicken',
  'res': 'beef', 
  'cerdo': 'pork',
  'pescado': 'fish',
  'arroz': 'rice',
  'pasta': 'pasta',
  'pan': 'bread',
  'huevo': 'egg',
  'leche': 'milk',
  'queso': 'cheese',
  'tomate': 'tomato',
  'cebolla': 'onion',
  'papa': 'potato',
  'patata': 'potato',
  'manzana': 'apple',
  'platano': 'banana',
  'naranja': 'orange',
  
  // Common abbreviations and aliases
  'chicken breast': 'chicken, breast',
  'chicken thigh': 'chicken, thigh',
  'ground beef': 'beef, ground',
  'white rice': 'rice, white',
  'brown rice': 'rice, brown',
  'whole wheat bread': 'bread, whole wheat',
  'skim milk': 'milk, skim',
  'whole milk': 'milk, whole',
};

// Priority food categories for better matching
const FOOD_CATEGORY_PRIORITIES: Record<string, string[]> = {
  'proteins': ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
  'carbs': ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
  'sugar': ['Branded', 'Foundation'],
};

export function AutoCalorieCalculator({
  foodDescription,
  quantity,
  onCaloriesCalculated,
  onFoodMatched,
  disabled = false
}: AutoCalorieCalculatorProps) {
  const { t } = useTranslation();
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationStatus, setCalculationStatus] = useState<'idle' | 'searching' | 'found' | 'multiple' | 'error'>('idle');
  const [matchedFoods, setMatchedFoods] = useState<USDASearchResult[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [calculatedCalories, setCalculatedCalories] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Smart food name mapping
  const getSearchTerm = useCallback((description: string): string => {
    const normalizedDesc = description.toLowerCase().trim();
    
    // Check direct mappings first
    if (FOOD_NAME_MAPPINGS[normalizedDesc]) {
      return FOOD_NAME_MAPPINGS[normalizedDesc];
    }
    
    // Check partial mappings
    for (const [key, value] of Object.entries(FOOD_NAME_MAPPINGS)) {
      if (normalizedDesc.includes(key)) {
        return normalizedDesc.replace(key, value);
      }
    }
    
    return description;
  }, []);

  // Update search term when food description changes
  useEffect(() => {
    if (foodDescription) {
      const mappedTerm = getSearchTerm(foodDescription);
      setSearchTerm(mappedTerm);
    }
  }, [foodDescription, getSearchTerm]);

  // Search USDA database
  const { data: searchResults, isLoading: isSearching } = useQuery<USDASearchResponse>({
    queryKey: ["/api/usda/search", { query: searchTerm }],
    enabled: Boolean(searchTerm && searchTerm.length >= 2 && !disabled),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get nutrition data for selected food
  const { data: nutritionData, isLoading: isLoadingNutrition } = useQuery<{ data: NutritionData }>({
    queryKey: [`/api/usda/nutrients/${selectedFoodId}`],
    enabled: Boolean(selectedFoodId),
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Automatic food matching logic
  useEffect(() => {
    if (!searchResults?.foods || !foodDescription || !quantity || disabled) {
      return;
    }

    setIsCalculating(true);
    setCalculationStatus('searching');

    const foods = searchResults.foods;
    
    if (foods.length === 0) {
      setCalculationStatus('error');
      setIsCalculating(false);
      return;
    }

    // Try to find the best match based on description similarity
    const bestMatch = findBestFoodMatch(foods, foodDescription);
    
    if (bestMatch) {
      setSelectedFoodId(bestMatch.fdcId);
      setMatchedFoods([bestMatch]);
      setCalculationStatus('found');
      onFoodMatched?.(bestMatch);
    } else if (foods.length > 1) {
      // Multiple matches found - show options
      setMatchedFoods(foods.slice(0, 5)); // Limit to 5 options
      setCalculationStatus('multiple');
      setIsCalculating(false);
    } else {
      // Single match - use it
      setSelectedFoodId(foods[0].fdcId);
      setMatchedFoods([foods[0]]);
      setCalculationStatus('found');
      onFoodMatched?.(foods[0]);
    }
  }, [searchResults, foodDescription, quantity, disabled, onFoodMatched]);

  // Calculate calories when nutrition data is available
  useEffect(() => {
    if (nutritionData?.data && quantity > 0) {
      const usdaCaloriesPer100g = nutritionData.data.calories || 0;
      const calculatedCals = Math.round((usdaCaloriesPer100g / 100) * quantity);
      
      setCalculatedCalories(calculatedCals);
      setCalculationStatus('found');
      setIsCalculating(false);
      
      onCaloriesCalculated(calculatedCals, nutritionData.data.fdcId, nutritionData.data);
    }
  }, [nutritionData, quantity, onCaloriesCalculated]);

  // Smart food matching algorithm
  const findBestFoodMatch = (foods: USDASearchResult[], searchTerm: string): USDASearchResult | null => {
    const term = searchTerm.toLowerCase();
    
    // Exact match
    const exactMatch = foods.find(food => 
      food.description.toLowerCase() === term
    );
    if (exactMatch) return exactMatch;

    // Starts with match
    const startsWithMatch = foods.find(food => 
      food.description.toLowerCase().startsWith(term)
    );
    if (startsWithMatch) return startsWithMatch;

    // Contains match with high relevance score
    const containsMatches = foods.filter(food => 
      food.description.toLowerCase().includes(term)
    );
    
    if (containsMatches.length === 1) {
      return containsMatches[0];
    }

    // For proteins, prioritize raw/fresh items
    if (term.includes('chicken') || term.includes('pollo')) {
      const rawChicken = containsMatches.find(food => 
        food.description.toLowerCase().includes('raw') ||
        food.description.toLowerCase().includes('fresh') ||
        food.description.toLowerCase().includes('broiler')
      );
      if (rawChicken) return rawChicken;
    }

    // Return first match if multiple
    return containsMatches[0] || null;
  };

  const handleFoodSelection = (fdcId: number) => {
    setSelectedFoodId(fdcId);
    const selectedFood = matchedFoods.find(f => f.fdcId === fdcId);
    if (selectedFood) {
      onFoodMatched?.(selectedFood);
    }
  };

  const renderCalculationStatus = () => {
    if (disabled) {
      return (
        <div className="text-sm text-muted-foreground">
          Automatic calculation disabled
        </div>
      );
    }

    switch (calculationStatus) {
      case 'idle':
        return foodDescription && quantity > 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calculator className="h-4 w-4" />
            Ready to calculate calories...
          </div>
        ) : null;

      case 'searching':
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching USDA database...
          </div>
        );

      case 'found':
        return calculatedCalories ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Calculated: {calculatedCalories} calories ({quantity}g)
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculating calories...
          </div>
        );

      case 'multiple':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Info className="h-4 w-4" />
              Multiple foods found. Select the best match:
            </div>
            <Select value={selectedFoodId?.toString()} onValueChange={(value) => handleFoodSelection(parseInt(value))}>
              <SelectTrigger data-testid="select-food-match">
                <SelectValue placeholder="Choose food match..." />
              </SelectTrigger>
              <SelectContent>
                {matchedFoods.map((food) => (
                  <SelectItem key={food.fdcId} value={food.fdcId.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{food.description}</span>
                      <Badge variant="outline" className="ml-2">
                        {food.dataType}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            No matching foods found in USDA database
          </div>
        );

      default:
        return null;
    }
  };

  if (!foodDescription || quantity <= 0) {
    return null;
  }

  return (
    <Card className="mt-2" data-testid="auto-calorie-calculator">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Automatic Calorie Calculation
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Food: "{foodDescription}" ({quantity}g)
            {searchTerm !== foodDescription && (
              <span className="ml-2 text-blue-600">
                → Searching for: "{searchTerm}"
              </span>
            )}
          </div>
          
          {renderCalculationStatus()}
          
          {calculatedCalories && nutritionData?.data && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded border">
              <div className="text-sm font-medium text-green-800 dark:text-green-200">
                ✓ {calculatedCalories} calories calculated
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Based on USDA data: {nutritionData.data.calories} cal/100g × {quantity}g
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AutoCalorieCalculator;