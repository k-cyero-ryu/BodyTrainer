import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Utensils, 
  Scale,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import type { NutritionData } from "@shared/schema";

interface FoodDropdownSelectorProps {
  onFoodSelect: (data: {
    food: NutritionData;
    quantity: number;
    calculatedCalories: number;
    calculatedNutrition: NutritionData;
  }) => void;
  className?: string;
  placeholder?: string;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  hideTitle?: boolean;
}

interface CuratedFoodsResponse {
  success: boolean;
  data: NutritionData[];
  count: number;
  message: string;
}

const FOOD_CATEGORIES = [
  'all',
  'proteins', 
  'carbohydrates', 
  'fruits', 
  'vegetables', 
  'dairy', 
  'fats', 
  'legumes'
];

export function FoodDropdownSelector({
  onFoodSelect,
  className = "",
  placeholder,
  selectedCategory = "all",
  onCategoryChange,
  hideTitle = false
}: FoodDropdownSelectorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("100");
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Fetch curated foods list
  const { data: foodsResponse, isLoading, error } = useQuery<CuratedFoodsResponse>({
    queryKey: ["/api/usda/curated-foods"],
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const foods = foodsResponse?.data || [];
  
  // Filter foods by category
  const filteredFoods = selectedCategory === "all" 
    ? foods 
    : foods.filter(food => food.category === selectedCategory);

  // Get selected food data
  const selectedFood = foods.find(food => food.fdcId.toString() === selectedFoodId);

  // Calculate nutrition based on quantity
  const calculateNutrition = (food: NutritionData, quantityGrams: number): NutritionData => {
    const factor = quantityGrams / 100; // USDA data is per 100g
    
    return {
      ...food,
      calories: food.calories ? Math.round(food.calories * factor) : undefined,
      protein: food.protein ? Math.round(food.protein * factor * 100) / 100 : undefined,
      carbs: food.carbs ? Math.round(food.carbs * factor * 100) / 100 : undefined,
      totalFat: food.totalFat ? Math.round(food.totalFat * factor * 100) / 100 : undefined,
      fiber: food.fiber ? Math.round(food.fiber * factor * 100) / 100 : undefined,
      sugar: food.sugar ? Math.round(food.sugar * factor * 100) / 100 : undefined,
      sodium: food.sodium ? Math.round(food.sodium * factor) : undefined,
      servingSize: quantityGrams,
      servingUnit: 'g'
    };
  };

  // Handle food selection and calculation
  const handleCalculate = async () => {
    if (!selectedFood || !quantity) {
      toast({
        title: t('errors.validation'),
        description: "Please select a food and enter quantity",
        variant: "destructive"
      });
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: t('errors.validation'),
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      const calculatedNutrition = calculateNutrition(selectedFood, quantityNum);
      
      onFoodSelect({
        food: selectedFood,
        quantity: quantityNum,
        calculatedCalories: calculatedNutrition.calories || 0,
        calculatedNutrition
      });

      // Reset form
      setSelectedFoodId("");
      setQuantity("100");

      toast({
        title: "Success",
        description: `Calculated ${calculatedNutrition.calories || 0} calories for ${quantityNum}g of ${selectedFood.name}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: t('errors.calculation'),
        description: "Failed to calculate nutrition values",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedFoodId(""); // Reset food selection when category changes
    onCategoryChange?.(category);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive" data-testid="error-loading-foods">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load food database</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {!hideTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Food Calculator
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div className="space-y-2">
          <Label htmlFor="category-select">Food Category</Label>
          <Select key={`category-${selectedCategory}`} value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger data-testid="select-food-category">
              <SelectValue>
                {selectedCategory === 'all' ? 'All Categories' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FOOD_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category} data-testid={`option-category-${category}`}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Food Selection */}
        <div className="space-y-2">
          <Label htmlFor="food-select">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Food Item
            </div>
          </Label>
          
          {isLoading ? (
            <div className="flex items-center gap-2 p-3 border rounded-md" data-testid="loading-foods">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading foods...</span>
            </div>
          ) : (
            <Select value={selectedFoodId} onValueChange={setSelectedFoodId}>
              <SelectTrigger data-testid="select-food-item">
                <SelectValue placeholder={placeholder || "Select a food item"} />
              </SelectTrigger>
              <SelectContent>
                {filteredFoods.length === 0 ? (
                  <SelectItem value="no-foods" disabled>
                    No foods available in this category
                  </SelectItem>
                ) : (
                  filteredFoods.map((food) => (
                    <SelectItem 
                      key={food.fdcId} 
                      value={food.fdcId.toString()}
                      data-testid={`option-food-${food.fdcId}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{food.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {food.calories || 0} cal/100g
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label htmlFor="quantity-input">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Quantity (grams)
            </div>
          </Label>
          <Input
            id="quantity-input"
            type="number"
            placeholder="100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            step="0.1"
            data-testid="input-food-quantity"
          />
        </div>

        {/* Preview Calculation */}
        {selectedFood && quantity && !isNaN(parseFloat(quantity)) && parseFloat(quantity) > 0 && (
          <div className="p-3 bg-muted rounded-md space-y-2" data-testid="nutrition-preview">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Nutrition Preview
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Calories:</span>{" "}
                <span className="text-primary font-bold">
                  {calculateNutrition(selectedFood, parseFloat(quantity)).calories || 0}
                </span>
              </div>
              {selectedFood.protein && (
                <div>
                  <span className="font-medium">Protein:</span>{" "}
                  {calculateNutrition(selectedFood, parseFloat(quantity)).protein}g
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calculate Button */}
        <Button 
          onClick={handleCalculate}
          disabled={!selectedFood || !quantity || isCalculating || isNaN(parseFloat(quantity))}
          className="w-full"
          data-testid="button-calculate-nutrition"
        >
          {isCalculating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Add Food Entry
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default FoodDropdownSelector;