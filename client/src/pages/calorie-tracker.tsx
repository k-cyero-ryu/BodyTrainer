import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import i18n from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Target, 
  Plus,
  ChevronLeft, 
  ChevronRight,
  Edit2,
  Trash2,
  Settings,
  Calendar,
  Utensils,
  TrendingUp,
  Coffee,
  Apple,
  Sandwich,
  Cookie,
  Search,
  CheckCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FoodDropdownSelector from "@/components/FoodDropdownSelector";
import FoodSearchAutocomplete from "@/components/FoodSearchAutocomplete";
import AutoCalorieCalculator from "@/components/AutoCalorieCalculator";
import type { NutritionData } from "@shared/schema";
import { translateFoodName } from "@/lib/foodTranslations";

// TypeScript interfaces for API responses
interface CalorieSummary {
  total: number;
  goal: number;
  breakdown?: {
    foodEntries: number;
    customEntries: number;
  };
}

interface GoalData {
  goal: number;
}

interface CustomCalorieEntry {
  id: string;
  description: string;
  calories: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
  date: string;
}

interface FoodEntryWithCalories {
  id: string;
  description: string;
  quantity: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  category: 'carbs' | 'proteins' | 'sugar';
  calories?: number;
  isIncludedInCalories?: boolean;
  notes?: string;
  date: string;
}

// Calorie Goal Form Schema
const getCalorieGoalSchema = (t: any) => z.object({
  goal: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val) : val
  ).refine(val => val > 0 && val <= 10000, t('validation.goalRange'))
});

// Custom Calorie Entry Form Schema
const getCustomCalorieEntrySchema = (t: any) => z.object({
  description: z.string().min(1, t('validation.descriptionRequired')),
  quantity: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ).refine(val => val > 0 && val <= 5000, t('validation.quantityRange')).optional(),
  calories: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val) : val
  ).refine(val => val > 0 && val <= 5000, t('validation.caloriesRange')),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  notes: z.string().optional(),
  // USDA-specific fields
  fdcId: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  totalFat: z.number().optional(),
  isUSDAFood: z.boolean().optional(),
});

// Food Entry Calories Update Schema
const getUpdateCaloriesSchema = (t: any) => z.object({
  calories: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseInt(val) : val
  ).refine(val => val >= 0 && val <= 5000, t('validation.caloriesUpdateRange'))
});

type CalorieGoalFormData = z.infer<ReturnType<typeof getCalorieGoalSchema>>;
type CustomCalorieEntryFormData = z.infer<ReturnType<typeof getCustomCalorieEntrySchema>>;
type UpdateCaloriesFormData = z.infer<ReturnType<typeof getUpdateCaloriesSchema>>;

const getMealTypeIcon = (mealType: string) => {
  switch (mealType) {
    case 'breakfast': return <Coffee className="h-4 w-4" />;
    case 'lunch': return <Sandwich className="h-4 w-4" />;
    case 'dinner': return <Utensils className="h-4 w-4" />;
    case 'snack': return <Cookie className="h-4 w-4" />;
    default: return <Apple className="h-4 w-4" />;
  }
};

const getMealTypeLabel = (mealType: string | undefined, t: any) => {
  switch (mealType) {
    case 'breakfast': return t('mealType.breakfast');
    case 'lunch': return t('mealType.lunch');
    case 'dinner': return t('mealType.dinner');
    case 'snack': return t('mealType.snack');
    default: return t('mealType.general');
  }
};

const getCategoryLabel = (category: string | undefined, t: any) => {
  switch (category) {
    case 'proteins': return t('dailyResume.proteins');
    case 'carbohydrates': 
    case 'carbs': return t('dailyResume.carbohydrates');
    case 'sugar': return t('dailyResume.fruits');
    default: return category || '';
  }
};

export default function CalorieTracker() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  // Two main modes for the calorie tracker
  const [viewMode, setViewMode] = useState<'daily-resume' | 'direct-entry'>('daily-resume');
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isCustomEntryDialogOpen, setIsCustomEntryDialogOpen] = useState(false);
  const [editingCustomEntry, setEditingCustomEntry] = useState<CustomCalorieEntry | null>(null);
  
  // USDA food search states
  const [selectedUSDAFood, setSelectedUSDAFood] = useState<NutritionData | null>(null);
  const [showUSDASearch, setShowUSDASearch] = useState(false);
  const [autoCalculatedCalories, setAutoCalculatedCalories] = useState<number | null>(null);
  const [autoCalculatedNutrition, setAutoCalculatedNutrition] = useState<NutritionData | null>(null);

  const goalForm = useForm<CalorieGoalFormData>({
    resolver: zodResolver(getCalorieGoalSchema(t)),
    defaultValues: { goal: 2000 },
  });

  const customEntryForm = useForm<CustomCalorieEntryFormData>({
    resolver: zodResolver(getCustomCalorieEntrySchema(t)),
    defaultValues: {
      description: '',
      quantity: 0,
      calories: 0,
      mealType: 'breakfast',
      notes: '',
      fdcId: undefined,
      protein: undefined,
      carbs: undefined,
      totalFat: undefined,
      isUSDAFood: false,
    },
  });

  const updateCaloriesForm = useForm<UpdateCaloriesFormData>({
    resolver: zodResolver(getUpdateCaloriesSchema(t)),
    defaultValues: { calories: 0 },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('auth.unauthorized'),
        description: t('auth.loggedOutRetry'),
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch daily calorie summary
  const { data: calorieSummary, isLoading: loadingSummary } = useQuery<CalorieSummary>({
    queryKey: [`/api/calories/summary/${selectedDate}`],
    enabled: isAuthenticated && selectedDate !== '',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  // Fetch calorie goal
  const { data: goalData, isLoading: loadingGoal } = useQuery<GoalData>({
    queryKey: ['/api/calories/goal'],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  // Fetch custom calorie entries for the date
  const { data: customEntries = [], isLoading: loadingCustomEntries } = useQuery<CustomCalorieEntry[]>({
    queryKey: [`/api/custom-calories/${selectedDate}`],
    enabled: isAuthenticated && selectedDate !== '',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  // Fetch food entries for the date
  const { data: foodEntries = [], isLoading: loadingFoodEntries } = useQuery<FoodEntryWithCalories[]>({
    queryKey: ['/api/client/food-entries', { date: selectedDate }],
    enabled: isAuthenticated && selectedDate !== '',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  // Set calorie goal mutation
  const setGoalMutation = useMutation({
    mutationFn: (data: CalorieGoalFormData) => 
      apiRequest("PUT", "/api/calories/goal", { goal: data.goal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calories/goal'] });
      queryClient.invalidateQueries({ queryKey: [`/api/calories/summary/${selectedDate}`] });
      setIsGoalDialogOpen(false);
      goalForm.reset();
      toast({
        title: t('common.success'),
        description: t('toast.calorieGoalUpdated'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('toast.calorieGoalUpdateFailed'),
        variant: "destructive",
      });
    },
  });

  // Create custom calorie entry mutation
  const createCustomEntryMutation = useMutation({
    mutationFn: (data: CustomCalorieEntryFormData) => 
      apiRequest("POST", "/api/custom-calories", {
        ...data,
        date: selectedDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/custom-calories/${selectedDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/calories/summary/${selectedDate}`] });
      setIsCustomEntryDialogOpen(false);
      setEditingCustomEntry(null);
      customEntryForm.reset();
      toast({
        title: t('common.success'),
        description: t('toast.customEntryAdded'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('toast.customEntryAddFailed'),
        variant: "destructive",
      });
    },
  });

  // Update custom calorie entry mutation
  const updateCustomEntryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<CustomCalorieEntryFormData> }) => 
      apiRequest("PUT", `/api/custom-calories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/custom-calories/${selectedDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/calories/summary/${selectedDate}`] });
      setIsCustomEntryDialogOpen(false);
      setEditingCustomEntry(null);
      customEntryForm.reset();
      toast({
        title: t('common.success'),
        description: t('toast.customEntryUpdated'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('toast.customEntryUpdateFailed'),
        variant: "destructive",
      });
    },
  });

  // Delete custom calorie entry mutation
  const deleteCustomEntryMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/custom-calories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/custom-calories/${selectedDate}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/calories/summary/${selectedDate}`] });
      toast({
        title: t('common.success'),
        description: t('toast.customEntryDeleted'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('toast.customEntryDeleteFailed'),
        variant: "destructive",
      });
    },
  });

  // Handle food selection from dropdown
  const handleFoodSelect = (data: {
    food: NutritionData;
    quantity: number;
    calculatedCalories: number;
    calculatedNutrition: NutritionData;
  }) => {
    // Create custom calorie entry with calculated data
    const entryData: CustomCalorieEntryFormData = {
      description: `${data.food.name} (${data.quantity}g)`,
      calories: data.calculatedCalories,
      mealType: selectedMealType,
      quantity: data.quantity,
      fdcId: data.food.fdcId,
      protein: data.calculatedNutrition.protein,
      carbs: data.calculatedNutrition.carbs,
      totalFat: data.calculatedNutrition.totalFat,
      isUSDAFood: true,
      notes: `Auto-calculated from USDA database. Per 100g: ${data.food.calories || 0} cal, ${data.food.protein || 0}g protein, ${data.food.carbs || 0}g carbs, ${data.food.totalFat || 0}g fat`
    };

    createCustomEntryMutation.mutate(entryData);
  };

  // Handle USDA food selection from autocomplete
  const handleUSDAFoodSelect = (food: NutritionData) => {
    setSelectedUSDAFood(food);
    setShowUSDASearch(false);
    // Pre-fill the form with USDA food data
    customEntryForm.setValue('description', food.name);
    customEntryForm.setValue('fdcId', food.fdcId);
    customEntryForm.setValue('isUSDAFood', true);
    if (food.calories) {
      customEntryForm.setValue('calories', food.calories);
    }
    if (food.protein) {
      customEntryForm.setValue('protein', food.protein);
    }
    if (food.carbs) {
      customEntryForm.setValue('carbs', food.carbs);
    }
    if (food.totalFat) {
      customEntryForm.setValue('totalFat', food.totalFat);
    }
  };

  // Update food entry calories mutation
  const updateFoodCaloriesMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: { calories?: number, isIncludedInCalories?: boolean } }) => 
      apiRequest("PATCH", `/api/food-entries/${id}/calories`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/food-entries', { date: selectedDate }] });
      queryClient.invalidateQueries({ queryKey: [`/api/calories/summary/${selectedDate}`] });
      toast({
        title: t('common.success'),
        description: t('toast.foodEntryUpdated'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('toast.foodEntryUpdateFailed'),
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    const newYear = newDate.getFullYear();
    const newMonth = String(newDate.getMonth() + 1).padStart(2, '0');
    const newDay = String(newDate.getDate()).padStart(2, '0');
    setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
  };

  const goToToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const openGoalDialog = () => {
    if (goalData?.goal) {
      goalForm.setValue('goal', goalData.goal);
    }
    setIsGoalDialogOpen(true);
  };

  const openCustomEntryDialog = (entry: CustomCalorieEntry | null = null) => {
    if (entry) {
      setEditingCustomEntry(entry);
      customEntryForm.reset({
        description: entry.description,
        calories: entry.calories,
        mealType: entry.mealType || 'breakfast',
        notes: entry.notes || '',
      });
    } else {
      setEditingCustomEntry(null);
      customEntryForm.reset({
        description: '',
        calories: 0,
        mealType: 'breakfast',
        notes: '',
      });
    }
    setIsCustomEntryDialogOpen(true);
  };

  const onSubmitGoal = (data: CalorieGoalFormData) => {
    setGoalMutation.mutate(data);
  };

  const onSubmitCustomEntry = (data: CustomCalorieEntryFormData) => {
    if (editingCustomEntry) {
      updateCustomEntryMutation.mutate({ id: editingCustomEntry.id, data });
    } else {
      createCustomEntryMutation.mutate(data);
    }
  };

  const toggleFoodEntryInclusion = (entry: FoodEntryWithCalories) => {
    updateFoodCaloriesMutation.mutate({
      id: entry.id,
      data: { isIncludedInCalories: !entry.isIncludedInCalories }
    });
  };

  const updateFoodEntryCalories = (entry: FoodEntryWithCalories, calories: number) => {
    updateFoodCaloriesMutation.mutate({
      id: entry.id,
      data: { calories }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = selectedDate === today;

  const calorieGoal = calorieSummary?.goal || goalData?.goal || 2000;
  const caloriesConsumed = calorieSummary?.total || 0;
  const caloriesRemaining = Math.max(0, calorieGoal - caloriesConsumed);
  const progressPercentage = calorieGoal > 0 ? Math.min(100, (caloriesConsumed / calorieGoal) * 100) : 0;
  const isOverGoal = caloriesConsumed > calorieGoal;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('calorieTracker.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('calorieTracker.subtitle')}
          </p>
        </div>
        <Button 
          onClick={openGoalDialog}
          variant="outline"
          className="mt-4 sm:mt-0"
          data-testid="button-set-goal"
        >
          <Settings className="h-4 w-4 mr-2" />
          {t('calorieTracker.setGoal')}
        </Button>
      </div>

      {/* Date Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
              data-testid="button-prev-date"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-4">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="text-selected-date">
                  {formatDate(selectedDate)}
                </p>
                {!isToday && (
                  <Button
                    variant="link"
                    onClick={goToToday}
                    className="text-sm p-0 h-auto"
                    data-testid="button-today"
                  >
                    {t('calorieTracker.goToToday')}
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
              data-testid="button-next-date"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Selection */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={viewMode === 'daily-resume' ? 'default' : 'outline'}
              onClick={() => setViewMode('daily-resume')}
              className="flex items-center space-x-2"
              data-testid="button-daily-resume-mode"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Daily Resume</span>
            </Button>
            <Button
              variant={viewMode === 'direct-entry' ? 'default' : 'outline'}
              onClick={() => setViewMode('direct-entry')}
              className="flex items-center space-x-2"
              data-testid="button-direct-entry-mode"
            >
              <Plus className="h-4 w-4" />
              <span>Direct Food Entry</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>{t('calorieTracker.dailyOverview')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSummary || loadingGoal ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Ring and Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-calories-consumed">
                      {caloriesConsumed}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">{t('calorieTracker.of')}</div>
                    <div className="text-xl font-semibold text-gray-700 dark:text-gray-300" data-testid="text-calorie-goal">
                      {calorieGoal} {t('calorieTracker.calories')}
                    </div>
                  </div>
                  <Progress 
                    value={progressPercentage} 
                    className={`h-3 ${isOverGoal ? 'progress-over' : ''}`}
                    data-testid="progress-calories"
                  />
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span data-testid="text-progress-percentage">
                      {progressPercentage.toFixed(1)}{t('calorieTracker.percentOfGoal')}
                    </span>
                    <span className={`font-semibold ${isOverGoal ? 'text-red-600' : 'text-green-600'}`} data-testid="text-calories-remaining">
                      {isOverGoal ? `+${caloriesConsumed - calorieGoal} ${t('calorieTracker.over')}` : `${caloriesRemaining} ${t('calorieTracker.remaining')}`}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('calorieTracker.goal')}</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="text-goal-display">
                      {calorieGoal}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('calorieTracker.consumed')}</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-consumed-display">
                      {caloriesConsumed}
                    </p>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              {calorieSummary?.breakdown && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('calorieTracker.breakdown')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('calorieTracker.foodEntries')}</span>
                      <span className="font-medium" data-testid="text-food-calories">
                        {calorieSummary.breakdown.foodEntries} {t('calorieTracker.cal')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('calorieTracker.quickEntries')}</span>
                      <span className="font-medium" data-testid="text-custom-calories">
                        {calorieSummary.breakdown.customEntries} {t('calorieTracker.cal')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conditional Content Based on View Mode */}
      {viewMode === 'daily-resume' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Food Entries Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Utensils className="h-5 w-5" />
              <span>{t('calorieTracker.foodEntriesTitle')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingFoodEntries ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : foodEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-food-entries">
                <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('calorieTracker.noFoodEntries')}</p>
                <p className="text-sm">{t('calorieTracker.noFoodEntriesHelp')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {foodEntries.map((entry: FoodEntryWithCalories) => (
                  <div 
                    key={entry.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                    data-testid={`food-entry-${entry.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getMealTypeIcon(entry.mealType)}
                          <Badge variant="secondary" data-testid={`badge-meal-type-${entry.id}`}>
                            {getMealTypeLabel(entry.mealType, t)}
                          </Badge>
                          <Badge variant="outline" data-testid={`badge-category-${entry.id}`}>
                            {getCategoryLabel(entry.category, t)}
                          </Badge>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white" data-testid={`text-food-description-${entry.id}`}>
                          {translateFoodName(entry.description, i18n.language)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('calorieTracker.quantity')} {entry.quantity}g
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid={`text-food-calories-${entry.id}`}>
                            {entry.calories || 0} cal
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {t('calorieTracker.includeInTotal')}
                            </span>
                            <Switch
                              checked={entry.isIncludedInCalories ?? true}
                              onCheckedChange={() => toggleFoodEntryInclusion(entry)}
                              data-testid={`switch-include-${entry.id}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Calories Display */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border w-32 text-center">
                        <span className="text-lg font-medium" data-testid={`display-calories-${entry.id}`}>
                          {entry.calories || 0}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('calorieTracker.calories')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Calorie Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>{t('calorieTracker.quickCalorieEntries')}</span>
              </div>
              <Button
                onClick={() => openCustomEntryDialog()}
                size="sm"
                data-testid="button-add-custom-entry"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('calorieTracker.add')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingCustomEntries ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : customEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-custom-entries">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('calorieTracker.noQuickEntries')}</p>
                <p className="text-sm">{t('calorieTracker.noQuickEntriesHelp')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customEntries.map((entry: CustomCalorieEntry) => (
                  <div 
                    key={entry.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2"
                    data-testid={`custom-entry-${entry.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {entry.mealType && getMealTypeIcon(entry.mealType)}
                          {entry.mealType && (
                            <Badge variant="secondary" data-testid={`badge-custom-meal-${entry.id}`}>
                              {getMealTypeLabel(entry.mealType, t)}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white" data-testid={`text-custom-description-${entry.id}`}>
                          {translateFoodName(entry.description, i18n.language)}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-lg font-bold text-gray-900 dark:text-white" data-testid={`text-custom-calories-${entry.id}`}>
                          {entry.calories} cal
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCustomEntryDialog(entry)}
                          data-testid={`button-edit-custom-${entry.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCustomEntryMutation.mutate(entry.id)}
                          data-testid={`button-delete-custom-${entry.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      ) : (
        /* Direct Food Entry Mode */
        <div className="space-y-6">
          {/* Meal Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>{t('calorieTracker.directFoodEntry')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">{t('calorieTracker.selectMealType')}</Label>
                  <Select value={selectedMealType} onValueChange={(value: 'breakfast' | 'lunch' | 'dinner' | 'snack') => setSelectedMealType(value)}>
                    <SelectTrigger className="w-full mt-2" data-testid="select-meal-type-direct">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">
                        <div className="flex items-center space-x-2">
                          <Coffee className="h-4 w-4" />
                          <span>{t('mealType.breakfast')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="lunch">
                        <div className="flex items-center space-x-2">
                          <Sandwich className="h-4 w-4" />
                          <span>{t('mealType.lunch')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dinner">
                        <div className="flex items-center space-x-2">
                          <Utensils className="h-4 w-4" />
                          <span>{t('mealType.dinner')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="snack">
                        <div className="flex items-center space-x-2">
                          <Cookie className="h-4 w-4" />
                          <span>{t('mealType.snack')}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="mb-2">{t('calorieTracker.directEntryInstructions')}</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>{t('calorieTracker.selectFoodFromDropdown')}</li>
                    <li>{t('calorieTracker.enterQuantityGrams')}</li>
                    <li>{t('calorieTracker.caloriesCalculatedAutomatically')}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Food Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>{t('calorieTracker.selectFood')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium">{t('calorieTracker.filterByCategory')}</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full mt-2" data-testid="select-category-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('calorieTracker.allCategories')}</SelectItem>
                      <SelectItem value="proteins">{t('foodCategories.proteins')}</SelectItem>
                      <SelectItem value="carbohydrates">{t('foodCategories.carbohydrates')}</SelectItem>
                      <SelectItem value="fruits">{t('foodCategories.fruits')}</SelectItem>
                      <SelectItem value="vegetables">{t('foodCategories.vegetables')}</SelectItem>
                      <SelectItem value="dairy">{t('foodCategories.dairy')}</SelectItem>
                      <SelectItem value="fats">{t('foodCategories.fats')}</SelectItem>
                      <SelectItem value="legumes">{t('foodCategories.legumes')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Food Dropdown Selector */}
                <FoodDropdownSelector
                  onFoodSelect={handleFoodSelect}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  placeholder={t('calorieTracker.searchFoodPlaceholder')}
                  data-testid="food-dropdown-selector"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goal Setting Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-goal-setting">
          <DialogHeader>
            <DialogTitle>{t('calorieTracker.setDailyGoal')}</DialogTitle>
          </DialogHeader>
          <Form {...goalForm}>
            <form onSubmit={goalForm.handleSubmit(onSubmitGoal)} className="space-y-6">
              <FormField
                control={goalForm.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calorieTracker.dailyCalorieGoal')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2000"
                        {...field}
                        data-testid="input-goal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsGoalDialogOpen(false)}
                  data-testid="button-cancel-goal"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={setGoalMutation.isPending}
                  data-testid="button-save-goal"
                >
                  {setGoalMutation.isPending ? t('common.saving') : t('calorieTracker.saveGoal')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Custom Entry Dialog */}
      <Dialog open={isCustomEntryDialogOpen} onOpenChange={setIsCustomEntryDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-custom-entry">
          <DialogHeader>
            <DialogTitle>
              {editingCustomEntry ? t('calorieTracker.editQuickEntry') : t('calorieTracker.addQuickEntry')}
            </DialogTitle>
          </DialogHeader>
          
          {/* USDA Food Search Integration - Only for new entries */}
          {!editingCustomEntry && (
            <div className="mb-4">
              <FoodSearchAutocomplete
                onFoodSelect={handleUSDAFoodSelect}
                trigger={
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    type="button"
                    data-testid="button-search-usda-food-tracker"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {t('usda.searchFood')}
                  </Button>
                }
                isOpen={showUSDASearch}
                onOpenChange={setShowUSDASearch}
              />
              
              {selectedUSDAFood && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800" data-testid="selected-usda-food-info-tracker">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      {t('usda.usdaEntry')}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300" data-testid="text-selected-food-name-tracker">
                    {selectedUSDAFood.name}
                  </p>
                  {selectedUSDAFood.calories && (
                    <p className="text-xs text-green-600 dark:text-green-400" data-testid="text-selected-food-calories-tracker">
                      {selectedUSDAFood.calories} {t('usda.caloriesPer100g')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <Form {...customEntryForm}>
            <form onSubmit={customEntryForm.handleSubmit(onSubmitCustomEntry)} className="space-y-6">
              <FormField
                control={customEntryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calorieTracker.description')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('calorieTracker.descriptionPlaceholder')}
                        {...field}
                        data-testid="input-custom-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={customEntryForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calorieTracker.quantityGrams')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        data-testid="input-custom-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Automatic Calorie Calculator */}
              <AutoCalorieCalculator
                foodDescription={customEntryForm.watch('description') || ''}
                quantity={Number(customEntryForm.watch('quantity')) || 0}
                onCaloriesCalculated={(calories, fdcId, nutritionData) => {
                  setAutoCalculatedCalories(calories);
                  setAutoCalculatedNutrition(nutritionData || null);
                  // Update form with calculated values
                  customEntryForm.setValue('calories', calories);
                  if (fdcId) {
                    customEntryForm.setValue('fdcId', fdcId);
                    customEntryForm.setValue('isUSDAFood', true);
                  }
                  if (nutritionData) {
                    customEntryForm.setValue('protein', nutritionData.protein || 0);
                    customEntryForm.setValue('carbs', nutritionData.carbs || 0);
                    customEntryForm.setValue('totalFat', nutritionData.totalFat || 0);
                  }
                }}
              />

              <FormField
                control={customEntryForm.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calorieTracker.calories')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="250"
                        {...field}
                        data-testid="input-custom-calories"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={customEntryForm.control}
                name="mealType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calorieTracker.mealTypeOptional')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-custom-meal-type">
                          <SelectValue placeholder={t('calorieTracker.selectMealType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="breakfast">{t('mealType.breakfast')}</SelectItem>
                        <SelectItem value="lunch">{t('mealType.lunch')}</SelectItem>
                        <SelectItem value="dinner">{t('mealType.dinner')}</SelectItem>
                        <SelectItem value="snack">{t('mealType.snack')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={customEntryForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calorieTracker.notesOptional')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('calorieTracker.notesPlaceholder')}
                        className="resize-none"
                        {...field}
                        data-testid="input-custom-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCustomEntryDialogOpen(false);
                    setEditingCustomEntry(null);
                    setSelectedUSDAFood(null);
                    customEntryForm.reset();
                  }}
                  data-testid="button-cancel-custom"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createCustomEntryMutation.isPending || updateCustomEntryMutation.isPending}
                  data-testid="button-save-custom"
                >
                  {(createCustomEntryMutation.isPending || updateCustomEntryMutation.isPending) 
                    ? t('common.saving') 
                    : editingCustomEntry ? t('calorieTracker.updateEntry') : t('calorieTracker.addEntry')
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}