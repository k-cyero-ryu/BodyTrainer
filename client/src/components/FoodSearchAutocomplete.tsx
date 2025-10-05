import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Loader2, 
  ChefHat, 
  Info,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { USDASearchResponse, USDASearchResult, NutritionData } from "@shared/schema";
import { searchCommonFoods, getTranslatedFoodName, type CommonFood } from "@/data/commonFoods";

interface FoodSearchAutocompleteProps {
  onFoodSelect: (food: SelectedFoodData) => void;
  placeholder?: string;
  className?: string;
  trigger?: React.ReactNode;
  defaultSearchTerm?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface SelectedFoodData {
  fdcId: number;
  name: string;
  brand?: string;
  category?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  totalFat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize?: number;
  servingUnit?: string;
  isUSDAFood: boolean;
}

export function FoodSearchAutocomplete({
  onFoodSelect,
  placeholder,
  className = "",
  trigger,
  defaultSearchTerm = "",
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange
}: FoodSearchAutocompleteProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(defaultSearchTerm);
  const [selectedFood, setSelectedFood] = useState<USDASearchResult | null>(null);
  const [selectedCommonFood, setSelectedCommonFood] = useState<CommonFood | null>(null);
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentLang = (i18n.language?.split('-')[0] || 'en') as 'en' | 'es' | 'fr' | 'pt';
  
  // Handle external vs internal open state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalIsOpen;
  
  // Search common foods locally
  const commonFoodResults = useMemo(() => {
    if (debouncedSearchTerm.trim().length < 2) return [];
    return searchCommonFoods(debouncedSearchTerm, currentLang);
  }, [debouncedSearchTerm, currentLang]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-focus search input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFood(null);
      setSelectedCommonFood(null);
      setShowNutritionDetails(false);
      if (!defaultSearchTerm) {
        setSearchTerm("");
      }
    }
  }, [isOpen, defaultSearchTerm]);

  // Search foods using USDA API
  const { data: searchResults, isLoading: isSearching, error: searchError } = useQuery<USDASearchResponse>({
    queryKey: ["/api/usda/search", { query: debouncedSearchTerm }],
    enabled: debouncedSearchTerm.trim().length >= 2,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get nutrition details for selected food (only for USDA foods)
  const { data: nutritionData, isLoading: isLoadingNutrition, error: nutritionError } = useQuery<{ data: NutritionData }>({
    queryKey: [`/api/usda/nutrients/${selectedFood?.fdcId}`],
    enabled: !!selectedFood?.fdcId && !selectedCommonFood,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleFoodSelection = (food: USDASearchResult) => {
    setSelectedFood(food);
    setSelectedCommonFood(null);
    setShowNutritionDetails(true);
  };

  const handleCommonFoodSelection = (food: CommonFood) => {
    const usdaFormat: USDASearchResult = {
      fdcId: food.fdcId,
      description: getTranslatedFoodName(food, currentLang),
      dataType: 'Common',
      foodCategory: food.category,
    };
    setSelectedFood(usdaFormat);
    setSelectedCommonFood(food);
    setShowNutritionDetails(true);
  };

  const handleConfirmSelection = () => {
    if (!selectedFood) return;

    if (selectedCommonFood) {
      const selectedFoodData: SelectedFoodData = {
        fdcId: selectedCommonFood.fdcId,
        name: getTranslatedFoodName(selectedCommonFood, currentLang),
        category: selectedCommonFood.category,
        calories: selectedCommonFood.nutrition.calories,
        protein: selectedCommonFood.nutrition.protein,
        carbs: selectedCommonFood.nutrition.carbs,
        totalFat: selectedCommonFood.nutrition.fat,
        servingSize: 100,
        servingUnit: 'g',
        isUSDAFood: false,
      };
      onFoodSelect(selectedFoodData);
      setIsOpen(false);
    } else if (nutritionData?.data) {
      const selectedFoodData: SelectedFoodData = {
        fdcId: selectedFood.fdcId,
        name: selectedFood.description,
        brand: selectedFood.brandOwner,
        category: selectedFood.foodCategory,
        calories: nutritionData.data.calories,
        protein: nutritionData.data.protein,
        carbs: nutritionData.data.carbs,
        totalFat: nutritionData.data.totalFat,
        fiber: nutritionData.data.fiber,
        sugar: nutritionData.data.sugar,
        sodium: nutritionData.data.sodium,
        servingSize: nutritionData.data.servingSize,
        servingUnit: nutritionData.data.servingUnit,
        isUSDAFood: true,
      };
      onFoodSelect(selectedFoodData);
      setIsOpen(false);
    }
  };

  const handleManualEntry = () => {
    const manualFoodData: SelectedFoodData = {
      fdcId: 0,
      name: searchTerm || "",
      isUSDAFood: false,
    };
    onFoodSelect(manualFoodData);
    setIsOpen(false);
  };

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild data-testid="trigger-food-search">
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" data-testid="dialog-food-search">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t('usda.searchFood')}
            </DialogTitle>
            <DialogDescription>
              Search the USDA food database to find nutritional information for your food items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Section */}
            {!showNutritionDetails && (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder={placeholder || t('usda.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-food-search"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleManualEntry}
                    data-testid="button-manual-entry"
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    {t('usda.manualEntry')}
                  </Button>
                </div>

                {/* Search State Messages */}
                {isSearching && (
                  <div className="flex items-center justify-center py-8" data-testid="loading-search">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>{t('usda.searching')}</span>
                  </div>
                )}

                {searchError && (
                  <div className="flex items-center justify-center py-8 text-destructive" data-testid="error-search">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>{t('usda.searchError')}</span>
                  </div>
                )}

                {debouncedSearchTerm.length >= 2 && !isSearching && !searchError && commonFoodResults.length === 0 && searchResults && searchResults.foods && searchResults.foods.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-results">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('usda.noResults')}</p>
                    <Button
                      variant="link"
                      onClick={handleManualEntry}
                      className="mt-2"
                      data-testid="link-manual-entry"
                    >
                      {t('usda.addManually')}
                    </Button>
                  </div>
                )}

                {/* Search Results */}
                {(commonFoodResults.length > 0 || (searchResults && searchResults.foods && Array.isArray(searchResults.foods) && searchResults.foods.length > 0)) && (
                  <div className="space-y-2 max-h-96 overflow-y-auto" data-testid="list-search-results">
                    <p className="text-sm text-muted-foreground">
                      {t('usda.selectFood')} ({commonFoodResults.length + (searchResults?.foods?.length || 0)} results)
                    </p>
                    
                    {/* Common Foods First */}
                    {commonFoodResults.map((food) => (
                      <Card
                        key={`common-${food.fdcId}`}
                        className="cursor-pointer hover:bg-accent transition-colors border-primary/20"
                        onClick={() => handleCommonFoodSelection(food)}
                        data-testid={`card-food-common-${food.fdcId}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium line-clamp-2" data-testid={`text-food-name-common-${food.fdcId}`}>
                                {getTranslatedFoodName(food, currentLang)}
                              </h4>
                              <p className="text-xs text-muted-foreground" data-testid={`text-category-common-${food.fdcId}`}>
                                {t('usda.category')} {food.category}
                              </p>
                            </div>
                            <Badge variant="default" className="ml-2 flex items-center gap-1" data-testid={`badge-common-${food.fdcId}`}>
                              <Zap className="h-3 w-3" />
                              Quick
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* USDA Foods */}
                    {searchResults && searchResults.foods && searchResults.foods.map((food) => food && (
                      <Card
                        key={`usda-${food.fdcId}`}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleFoodSelection(food)}
                        data-testid={`card-food-${food.fdcId}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium line-clamp-2" data-testid={`text-food-name-${food.fdcId}`}>
                                {food?.description || 'Unknown food'}
                              </h4>
                              {food?.brandOwner && (
                                <p className="text-sm text-muted-foreground mt-1" data-testid={`text-brand-${food.fdcId}`}>
                                  {t('usda.brand')} {food.brandOwner}
                                </p>
                              )}
                              {food?.foodCategory && (
                                <p className="text-xs text-muted-foreground" data-testid={`text-category-${food.fdcId}`}>
                                  {t('usda.category')} {food.foodCategory}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="ml-2" data-testid={`badge-datatype-${food.fdcId}`}>
                              {food?.dataType || 'Unknown'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ) || null).filter(Boolean)}
                  </div>
                )}

                {debouncedSearchTerm.length > 0 && debouncedSearchTerm.length < 2 && (
                  <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-search-hint">
                    Type at least 2 characters to search
                  </p>
                )}
              </>
            )}

            {/* Nutrition Details Section */}
            {showNutritionDetails && selectedFood && (
              <div className="space-y-4" data-testid="section-nutrition-details">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNutritionDetails(false)}
                    data-testid="button-back-to-search"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {t('usda.searchAgain')}
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      {t('usda.nutritionInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-lg" data-testid="text-selected-food-name">
                          {selectedFood.description}
                        </h4>
                        {selectedFood.brandOwner && (
                          <p className="text-sm text-muted-foreground" data-testid="text-selected-food-brand">
                            {t('usda.brand')} {selectedFood.brandOwner}
                          </p>
                        )}
                        {selectedFood.foodCategory && (
                          <p className="text-xs text-muted-foreground" data-testid="text-selected-food-category">
                            {t('usda.category')} {selectedFood.foodCategory}
                          </p>
                        )}
                      </div>

                      <Separator />

                      {isLoadingNutrition && !selectedCommonFood && (
                        <div className="space-y-2" data-testid="loading-nutrition">
                          <p className="text-sm text-muted-foreground">{t('usda.loadingNutrition')}</p>
                          <div className="space-y-2">
                            {[...Array(6)].map((_, i) => (
                              <Skeleton key={i} className="h-4 w-full" />
                            ))}
                          </div>
                        </div>
                      )}

                      {nutritionError && !selectedCommonFood && (
                        <div className="flex items-center gap-2 text-destructive" data-testid="error-nutrition">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">{t('usda.nutritionError')}</span>
                        </div>
                      )}

                      {selectedCommonFood && (
                        <div className="grid grid-cols-2 gap-4" data-testid="grid-nutrition-data">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Calories</p>
                            <p className="text-2xl font-bold text-primary" data-testid="text-calories">
                              {selectedCommonFood.nutrition.calories}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('usda.perServing', { amount: 100 })}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-medium">{t('usda.proteinLabel')}</p>
                            <p className="text-lg font-semibold" data-testid="text-protein">
                              {selectedCommonFood.nutrition.protein}{t('usda.grams')}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-medium">{t('usda.carbsLabel')}</p>
                            <p className="text-lg font-semibold" data-testid="text-carbs">
                              {selectedCommonFood.nutrition.carbs}{t('usda.grams')}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-medium">{t('usda.fatLabel')}</p>
                            <p className="text-lg font-semibold" data-testid="text-fat">
                              {selectedCommonFood.nutrition.fat}{t('usda.grams')}
                            </p>
                          </div>
                        </div>
                      )}

                      {nutritionData?.data && !selectedCommonFood && (
                        <div className="grid grid-cols-2 gap-4" data-testid="grid-nutrition-data">
                          {nutritionData.data.calories !== undefined && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Calories</p>
                              <p className="text-2xl font-bold text-primary" data-testid="text-calories">
                                {nutritionData.data.calories}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t('usda.perServing', { amount: nutritionData.data.servingSize || 100 })}
                              </p>
                            </div>
                          )}

                          {nutritionData.data.protein !== undefined && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{t('usda.proteinLabel')}</p>
                              <p className="text-lg font-semibold" data-testid="text-protein">
                                {nutritionData.data.protein}{t('usda.grams')}
                              </p>
                            </div>
                          )}

                          {nutritionData.data.carbs !== undefined && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{t('usda.carbsLabel')}</p>
                              <p className="text-lg font-semibold" data-testid="text-carbs">
                                {nutritionData.data.carbs}{t('usda.grams')}
                              </p>
                            </div>
                          )}

                          {nutritionData.data.totalFat !== undefined && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{t('usda.fatLabel')}</p>
                              <p className="text-lg font-semibold" data-testid="text-fat">
                                {nutritionData.data.totalFat}{t('usda.grams')}
                              </p>
                            </div>
                          )}

                          {nutritionData.data.fiber !== undefined && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{t('usda.fiberLabel')}</p>
                              <p className="text-lg font-semibold" data-testid="text-fiber">
                                {nutritionData.data.fiber}{t('usda.grams')}
                              </p>
                            </div>
                          )}

                          {nutritionData.data.sugar !== undefined && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{t('usda.sugarLabel')}</p>
                              <p className="text-lg font-semibold" data-testid="text-sugar">
                                {nutritionData.data.sugar}{t('usda.grams')}
                              </p>
                            </div>
                          )}

                          {nutritionData.data.sodium !== undefined && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{t('usda.sodiumLabel')}</p>
                              <p className="text-lg font-semibold" data-testid="text-sodium">
                                {nutritionData.data.sodium}{t('usda.milligrams')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {(nutritionData?.data || selectedCommonFood) && (
                        <>
                          <Separator />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleConfirmSelection}
                              className="flex-1"
                              disabled={isLoadingNutrition}
                              data-testid="button-use-food"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t('usda.useThisFood')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleManualEntry}
                              data-testid="button-manual-entry-alt"
                            >
                              <ChefHat className="h-4 w-4 mr-2" />
                              {t('usda.manualEntry')}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            {t('usda.changeQuantity')}
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild data-testid="trigger-food-search-default">
        <Button variant="outline" className={className}>
          <Search className="h-4 w-4 mr-2" />
          {t('usda.searchFood')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" data-testid="dialog-food-search">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('usda.searchFood')}
          </DialogTitle>
          <DialogDescription>
            Search the USDA food database to find nutritional information for your food items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          {!showNutritionDetails && (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder={placeholder || t('usda.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-food-search"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleManualEntry}
                  data-testid="button-manual-entry"
                >
                  <ChefHat className="h-4 w-4 mr-2" />
                  {t('usda.manualEntry')}
                </Button>
              </div>

              {/* Search State Messages */}
              {isSearching && (
                <div className="flex items-center justify-center py-8" data-testid="loading-search">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>{t('usda.searching')}</span>
                </div>
              )}

              {searchError && (
                <div className="flex items-center justify-center py-8 text-destructive" data-testid="error-search">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{t('usda.searchError')}</span>
                </div>
              )}

              {debouncedSearchTerm.length >= 2 && !isSearching && !searchError && commonFoodResults.length === 0 && searchResults && searchResults.foods && searchResults.foods.length === 0 && (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-results">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('usda.noResults')}</p>
                  <Button
                    variant="link"
                    onClick={handleManualEntry}
                    className="mt-2"
                    data-testid="link-manual-entry"
                  >
                    {t('usda.addManually')}
                  </Button>
                </div>
              )}

              {/* Search Results */}
              {(commonFoodResults.length > 0 || (searchResults && searchResults.foods && Array.isArray(searchResults.foods) && searchResults.foods.length > 0)) && (
                <div className="space-y-2 max-h-96 overflow-y-auto" data-testid="list-search-results">
                  <p className="text-sm text-muted-foreground">
                    {t('usda.selectFood')} ({commonFoodResults.length + (searchResults?.foods?.length || 0)} results)
                  </p>
                  
                  {/* Common Foods First */}
                  {commonFoodResults.map((food) => (
                    <Card
                      key={`common-${food.fdcId}`}
                      className="cursor-pointer hover:bg-accent transition-colors border-primary/20"
                      onClick={() => handleCommonFoodSelection(food)}
                      data-testid={`card-food-common-${food.fdcId}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium line-clamp-2" data-testid={`text-food-name-common-${food.fdcId}`}>
                              {getTranslatedFoodName(food, currentLang)}
                            </h4>
                            <p className="text-xs text-muted-foreground" data-testid={`text-category-common-${food.fdcId}`}>
                              {t('usda.category')} {food.category}
                            </p>
                          </div>
                          <Badge variant="default" className="ml-2 flex items-center gap-1" data-testid={`badge-common-${food.fdcId}`}>
                            <Zap className="h-3 w-3" />
                            Quick
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* USDA Foods */}
                  {searchResults && searchResults.foods && searchResults.foods.map((food) => food && (
                    <Card
                      key={`usda-${food.fdcId}`}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleFoodSelection(food)}
                      data-testid={`card-food-${food.fdcId}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium line-clamp-2" data-testid={`text-food-name-${food.fdcId}`}>
                              {food?.description || 'Unknown food'}
                            </h4>
                            {food?.brandOwner && (
                              <p className="text-sm text-muted-foreground mt-1" data-testid={`text-brand-${food.fdcId}`}>
                                {t('usda.brand')} {food.brandOwner}
                              </p>
                            )}
                            {food?.foodCategory && (
                              <p className="text-xs text-muted-foreground" data-testid={`text-category-${food.fdcId}`}>
                                {t('usda.category')} {food.foodCategory}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="ml-2" data-testid={`badge-datatype-${food.fdcId}`}>
                            {food?.dataType || 'Unknown'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ) || null).filter(Boolean)}
                </div>
              )}

              {debouncedSearchTerm.length > 0 && debouncedSearchTerm.length < 2 && (
                <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-search-hint">
                  Type at least 2 characters to search
                </p>
              )}
            </>
          )}

          {/* Nutrition Details Section */}
          {showNutritionDetails && selectedFood && (
            <div className="space-y-4" data-testid="section-nutrition-details">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNutritionDetails(false)}
                  data-testid="button-back-to-search"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {t('usda.searchAgain')}
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    {t('usda.nutritionInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-lg" data-testid="text-selected-food-name">
                        {selectedFood.description}
                      </h4>
                      {selectedFood.brandOwner && (
                        <p className="text-sm text-muted-foreground" data-testid="text-selected-food-brand">
                          {t('usda.brand')} {selectedFood.brandOwner}
                        </p>
                      )}
                      {selectedFood.foodCategory && (
                        <p className="text-xs text-muted-foreground" data-testid="text-selected-food-category">
                          {t('usda.category')} {selectedFood.foodCategory}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {isLoadingNutrition && !selectedCommonFood && (
                      <div className="space-y-2" data-testid="loading-nutrition">
                        <p className="text-sm text-muted-foreground">{t('usda.loadingNutrition')}</p>
                        <div className="space-y-2">
                          {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                          ))}
                        </div>
                      </div>
                    )}

                    {nutritionError && !selectedCommonFood && (
                      <div className="flex items-center gap-2 text-destructive" data-testid="error-nutrition">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{t('usda.nutritionError')}</span>
                      </div>
                    )}

                    {selectedCommonFood && (
                      <div className="grid grid-cols-2 gap-4" data-testid="grid-nutrition-data">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Calories</p>
                          <p className="text-2xl font-bold text-primary" data-testid="text-calories">
                            {selectedCommonFood.nutrition.calories}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('usda.perServing', { amount: 100 })}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t('usda.proteinLabel')}</p>
                          <p className="text-lg font-semibold" data-testid="text-protein">
                            {selectedCommonFood.nutrition.protein}{t('usda.grams')}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t('usda.carbsLabel')}</p>
                          <p className="text-lg font-semibold" data-testid="text-carbs">
                            {selectedCommonFood.nutrition.carbs}{t('usda.grams')}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium">{t('usda.fatLabel')}</p>
                          <p className="text-lg font-semibold" data-testid="text-fat">
                            {selectedCommonFood.nutrition.fat}{t('usda.grams')}
                          </p>
                        </div>
                      </div>
                    )}

                    {nutritionData?.data && !selectedCommonFood && (
                      <div className="grid grid-cols-2 gap-4" data-testid="grid-nutrition-data">
                        {nutritionData.data.calories !== undefined && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Calories</p>
                            <p className="text-2xl font-bold text-primary" data-testid="text-calories">
                              {nutritionData.data.calories}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('usda.perServing', { amount: nutritionData.data.servingSize || 100 })}
                            </p>
                          </div>
                        )}

                        {nutritionData.data.protein !== undefined && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{t('usda.proteinLabel')}</p>
                            <p className="text-lg font-semibold" data-testid="text-protein">
                              {nutritionData.data.protein}{t('usda.grams')}
                            </p>
                          </div>
                        )}

                        {nutritionData.data.carbs !== undefined && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{t('usda.carbsLabel')}</p>
                            <p className="text-lg font-semibold" data-testid="text-carbs">
                              {nutritionData.data.carbs}{t('usda.grams')}
                            </p>
                          </div>
                        )}

                        {nutritionData.data.totalFat !== undefined && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{t('usda.fatLabel')}</p>
                            <p className="text-lg font-semibold" data-testid="text-fat">
                              {nutritionData.data.totalFat}{t('usda.grams')}
                            </p>
                          </div>
                        )}

                        {nutritionData.data.fiber !== undefined && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{t('usda.fiberLabel')}</p>
                            <p className="text-lg font-semibold" data-testid="text-fiber">
                              {nutritionData.data.fiber}{t('usda.grams')}
                            </p>
                          </div>
                        )}

                        {nutritionData.data.sugar !== undefined && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{t('usda.sugarLabel')}</p>
                            <p className="text-lg font-semibold" data-testid="text-sugar">
                              {nutritionData.data.sugar}{t('usda.grams')}
                            </p>
                          </div>
                        )}

                        {nutritionData.data.sodium !== undefined && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{t('usda.sodiumLabel')}</p>
                            <p className="text-lg font-semibold" data-testid="text-sodium">
                              {nutritionData.data.sodium}{t('usda.milligrams')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {(nutritionData?.data || selectedCommonFood) && (
                      <>
                        <Separator />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleConfirmSelection}
                            className="flex-1"
                            disabled={isLoadingNutrition}
                            data-testid="button-use-food"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t('usda.useThisFood')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleManualEntry}
                            data-testid="button-manual-entry-alt"
                          >
                            <ChefHat className="h-4 w-4 mr-2" />
                            {t('usda.manualEntry')}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {t('usda.changeQuantity')}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FoodSearchAutocomplete;