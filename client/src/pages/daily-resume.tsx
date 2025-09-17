import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  Apple, 
  Plus,
  ChevronLeft, 
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  Activity,
  TrendingUp,
  Search,
  CheckCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FoodDropdownSelector from "@/components/FoodDropdownSelector";
import type { NutritionData } from "@shared/schema";

// Food Entry Form Schema
const getFoodEntrySchema = (t: any) => z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  category: z.enum(['carbs', 'proteins', 'sugar']),
  description: z.string().min(1, t('validation.foodDescriptionRequired')),
  quantity: z.string().min(1, t('validation.quantityRequired')),
  notes: z.string().optional(),
  // USDA-specific fields (optional)
  fdcId: z.number().optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  totalFat: z.number().optional(),
  isUSDAFood: z.boolean().optional(),
});

// Cardio Activity Form Schema
const getCardioActivitySchema = (t: any) => z.object({
  activityType: z.string().min(1, t('validation.activityTypeRequired')),
  duration: z.string().min(1, t('validation.durationRequired')),
  distance: z.string().optional(),
  notes: z.string().optional(),
});

type FoodEntryFormData = z.infer<ReturnType<typeof getFoodEntrySchema>>;
type CardioActivityFormData = z.infer<ReturnType<typeof getCardioActivitySchema>>;

export default function DailyResume() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const params = useParams();
  const clientId = params.clientId; // Will be undefined for clients viewing their own resume
  
  // Determine if this is a trainer viewing a client's resume
  const isTrainerView = Boolean(clientId && user?.role === 'trainer');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isFoodDialogOpen, setIsFoodDialogOpen] = useState(false);
  const [isCardioDialogOpen, setIsCardioDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<any>(null);
  const [editingCardio, setEditingCardio] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const foodForm = useForm<FoodEntryFormData>({
    resolver: zodResolver(getFoodEntrySchema(t)),
    defaultValues: {
      mealType: 'breakfast',
      category: 'carbs',
      description: '',
      quantity: '',
      notes: '',
      fdcId: undefined,
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      totalFat: undefined,
      isUSDAFood: false,
    },
  });

  const cardioForm = useForm<CardioActivityFormData>({
    resolver: zodResolver(getCardioActivitySchema(t)),
    defaultValues: {
      activityType: '',
      duration: '',
      distance: '',
      notes: '',
    },
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

  // Determine API endpoints based on view type
  const foodEntriesEndpoint = isTrainerView 
    ? `/api/clients/${clientId}/food-entries`
    : '/api/client/food-entries';
  const cardioActivitiesEndpoint = isTrainerView 
    ? `/api/clients/${clientId}/cardio-activities`
    : '/api/client/cardio-activities';

  // Fetch food entries for selected date
  const { data: foodEntries, isLoading: loadingFood } = useQuery({
    queryKey: [foodEntriesEndpoint, { date: selectedDate }],
    enabled: isAuthenticated && selectedDate !== '',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  // Fetch cardio activities for selected date
  const { data: cardioActivities, isLoading: loadingCardio } = useQuery({
    queryKey: [cardioActivitiesEndpoint, { date: selectedDate }],
    enabled: isAuthenticated && selectedDate !== '',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  // Fetch client information when trainer is viewing client data
  const { data: clientInfo } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    enabled: isTrainerView && Boolean(clientId),
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  // Fetch calorie summary for selected date (only for client view, not trainer view)
  const { data: calorieSummary, isLoading: loadingCalories } = useQuery({
    queryKey: ["/api/calories/summary", { date: selectedDate }],
    enabled: !isTrainerView && isAuthenticated && selectedDate !== '',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  // Create food entry mutation (only for clients, not trainers viewing client data)
  const createFoodMutation = useMutation({
    mutationFn: (data: FoodEntryFormData) => 
      apiRequest("POST", `/api/client/food-entries`, {
        ...data,
        date: selectedDate, // Send as string, backend will transform to Date
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [foodEntriesEndpoint, { date: selectedDate }] });
      queryClient.invalidateQueries({ queryKey: ["/api/calories/summary", { date: selectedDate }] });
      setIsFoodDialogOpen(false);
      foodForm.reset();
      toast({
        title: t('common.success'),
        description: t('toast.foodEntryAdded'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('toast.foodEntryAddFailed'),
        variant: "destructive",
      });
    },
  });

  // Create cardio activity mutation (only for clients, not trainers viewing client data)
  const createCardioMutation = useMutation({
    mutationFn: (data: CardioActivityFormData) => 
      apiRequest("POST", `/api/client/cardio-activities`, {
        ...data,
        duration: parseInt(data.duration),
        distance: data.distance ? parseFloat(data.distance) : null,
        date: selectedDate, // Send as string, backend will transform to Date
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [cardioActivitiesEndpoint, { date: selectedDate }] });
      queryClient.invalidateQueries({ queryKey: ["/api/calories/summary", { date: selectedDate }] });
      setIsCardioDialogOpen(false);
      cardioForm.reset();
      toast({
        title: t('common.success'),
        description: t('toast.cardioActivityAdded'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: t('toast.cardioActivityAddFailed'),
        variant: "destructive",
      });
    },
  });

  // Delete food entry mutation (only for clients, not trainers viewing client data)
  const deleteFoodMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/client/food-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [foodEntriesEndpoint, { date: selectedDate }] });
      queryClient.invalidateQueries({ queryKey: ["/api/calories/summary", { date: selectedDate }] });
      toast({
        title: t('common.success'),
        description: t('toast.foodEntryDeleted'),
      });
    },
  });

  // Delete cardio activity mutation (only for clients, not trainers viewing client data)
  const deleteCardioMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/client/cardio-activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [cardioActivitiesEndpoint, { date: selectedDate }] });
      queryClient.invalidateQueries({ queryKey: ["/api/calories/summary", { date: selectedDate }] });
      toast({
        title: t('common.success'),
        description: t('toast.cardioActivityDeleted'),
      });
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    // Parse the date string directly to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day); // month is 0-indexed
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

  const onSubmitFood = (data: FoodEntryFormData) => {
    createFoodMutation.mutate(data);
  };

  // Handle food selection from dropdown
  const handleFoodSelect = (data: {
    food: NutritionData;
    quantity: number;
    calculatedCalories: number;
    calculatedNutrition: NutritionData;
  }) => {
    // Auto-fill form with selected food data
    foodForm.setValue('description', `${data.food.name} (${data.quantity}g)`);
    foodForm.setValue('quantity', data.quantity.toString());
    foodForm.setValue('fdcId', data.food.fdcId);
    foodForm.setValue('calories', data.calculatedCalories);
    foodForm.setValue('protein', data.calculatedNutrition.protein);
    foodForm.setValue('carbs', data.calculatedNutrition.carbs);
    foodForm.setValue('totalFat', data.calculatedNutrition.totalFat);
    foodForm.setValue('isUSDAFood', true);
    
    // Auto-categorize based on macronutrients
    if (data.calculatedNutrition.protein && data.calculatedNutrition.protein > 10) {
      foodForm.setValue('category', 'proteins');
    } else if (data.calculatedNutrition.carbs && data.calculatedNutrition.carbs > 10) {
      foodForm.setValue('category', 'carbs');
    } else {
      foodForm.setValue('category', 'carbs'); // default
    }
    
    setIsFoodDialogOpen(false);
    // Submit the form automatically
    onSubmitFood({
      mealType: foodForm.getValues('mealType'),
      category: foodForm.getValues('category'),
      description: foodForm.getValues('description'),
      quantity: foodForm.getValues('quantity'),
      notes: foodForm.getValues('notes') || '',
      fdcId: data.food.fdcId,
      calories: data.calculatedCalories,
      protein: data.calculatedNutrition.protein,
      carbs: data.calculatedNutrition.carbs,
      totalFat: data.calculatedNutrition.totalFat,
      isUSDAFood: true,
    });
  };

  const onSubmitCardio = (data: CardioActivityFormData) => {
    createCardioMutation.mutate(data);
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isTrainerView 
              ? `${(clientInfo as any)?.firstName || (clientInfo as any)?.user?.firstName || 'Client'}'s ${t('dailyResume.title')}`
              : t('nav.dailyResume')
            }
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isTrainerView ? t('dailyResume.viewDescription') : t('dailyResume.trackDescription')}
          </p>
        </div>
      </div>

      {/* Date Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(selectedDate)}
              </h2>
              {!isToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {t('dailyWorkout.today')}
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calorie Summary Widget - Only shown in client view */}
      {!isTrainerView && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('calorieWidget.calorieSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCalories ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : calorieSummary && (calorieSummary as any).goal > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('calorieWidget.goal')}</p>
                    <p className="text-xl font-bold text-blue-600" data-testid="daily-calorie-goal">
                      {(calorieSummary as any).goal}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('calorieWidget.calSuffix')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('calorieWidget.consumed')}</p>
                    <p className="text-xl font-bold text-green-600" data-testid="daily-calorie-consumed">
                      {(calorieSummary as any).total}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('calorieWidget.calSuffix')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {(calorieSummary as any).remaining > 0 ? t('calorieWidget.remaining') : t('calorieWidget.over')}
                    </p>
                    <p className={`text-xl font-bold ${(calorieSummary as any).remaining > 0 ? 'text-orange-600' : 'text-red-600'}`} 
                       data-testid="daily-calorie-remaining">
                      {Math.abs((calorieSummary as any).remaining)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('calorieWidget.calSuffix')}</p>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('calorieWidget.consumed')}</span>
                    <span>
                      {Math.round(((calorieSummary as any).total / (calorieSummary as any).goal) * 100)}% {t('calorieWidget.percentOfGoal')}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, ((calorieSummary as any).total / (calorieSummary as any).goal) * 100)} 
                    className="h-2"
                    data-testid="daily-calorie-progress"
                  />
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <Badge 
                    variant={(calorieSummary as any).remaining > 0 ? "default" : "destructive"} 
                    data-testid="daily-calorie-status"
                  >
                    {(calorieSummary as any).remaining > 0 ? t('calorieWidget.onTrack') : t('calorieWidget.exceededGoal')}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.href = "/calorie-tracker"}
                    data-testid="daily-view-full-tracker"
                  >
                    {t('calorieWidget.viewFullTracker')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4" data-testid="daily-no-calorie-goal">
                <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">{t('calorieWidget.noGoalSet')}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/calorie-tracker"}
                  data-testid="daily-set-calorie-goal"
                >
                  {t('calorieWidget.setGoal')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Food Entries */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                {t('dailyResume.foodNutrition')}
              </CardTitle>
              {!isTrainerView && (
                <Dialog open={isFoodDialogOpen} onOpenChange={setIsFoodDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => foodForm.reset()}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dailyResume.addFood')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t('dailyResume.addFoodEntry')}</DialogTitle>
                  </DialogHeader>
                  
                  {/* Food Dropdown Selection */}
                  <div className="mb-4">
                    <FoodDropdownSelector
                      onFoodSelect={handleFoodSelect}
                      placeholder={t('dailyResume.selectFood')}
                      selectedCategory="all"
                    />
                  </div>
                  
                  <Form {...foodForm}>
                    <form onSubmit={foodForm.handleSubmit(onSubmitFood)} className="space-y-4">
                      <FormField
                        control={foodForm.control}
                        name="mealType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('dailyResume.mealType')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-meal-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="breakfast">{t('dailyResume.breakfast')}</SelectItem>
                                <SelectItem value="lunch">{t('dailyResume.lunch')}</SelectItem>
                                <SelectItem value="dinner">{t('dailyResume.dinner')}</SelectItem>
                                <SelectItem value="snack">{t('dailyResume.snack')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={foodForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('dailyResume.foodCategory')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-food-category">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="carbs">{t('dailyResume.carbs')}</SelectItem>
                                <SelectItem value="proteins">{t('dailyResume.proteins')}</SelectItem>
                                <SelectItem value="sugar">{t('dailyResume.sugar')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={foodForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('dailyResume.foodDescription')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('dailyResume.foodPlaceholder')} 
                                {...field} 
                                data-testid="input-food-description"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={foodForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('dailyResume.quantityGrams')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('dailyResume.quantityPlaceholder')} 
                                type="number" 
                                {...field} 
                                data-testid="input-food-quantity"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={foodForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('dailyResume.notesOptional')}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t('dailyResume.notesPlaceholder')} 
                                {...field} 
                                data-testid="textarea-food-notes"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsFoodDialogOpen(false);
                            foodForm.reset();
                          }}
                          data-testid="button-cancel-food-entry"
                        >
                          {t('dailyResume.cancel')}
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createFoodMutation.isPending}
                          data-testid="button-add-food-entry"
                        >
                          {createFoodMutation.isPending ? t('dailyResume.adding') : t('dailyResume.addEntry')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingFood ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : foodEntries && Array.isArray(foodEntries) && foodEntries.length > 0 ? (
              <div className="space-y-4">
                {foodEntries.map((entry: any) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {t(`dailyResume.${entry.mealType}`)}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {t(`dailyResume.${entry.category}`)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {entry.quantity}g
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {entry.description}
                        </h3>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteFoodMutation.mutate(entry.id)}
                        disabled={deleteFoodMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Apple className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t('dailyResume.noFoodEntries')}</p>
                <p className="text-sm text-gray-400">{t('dailyResume.addMealsToTrack')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cardio Activities */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('dailyResume.cardioActivities')}
              </CardTitle>
              {!isTrainerView && (
                <Dialog open={isCardioDialogOpen} onOpenChange={setIsCardioDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => cardioForm.reset()}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dailyResume.addActivity')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('dailyResume.addCardioActivity')}</DialogTitle>
                  </DialogHeader>
                  <Form {...cardioForm}>
                    <form onSubmit={cardioForm.handleSubmit(onSubmitCardio)} className="space-y-4">
                      <FormField
                        control={cardioForm.control}
                        name="activityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('dailyResume.activityType')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('dailyResume.activityPlaceholder')} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={cardioForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('dailyResume.durationMinutes')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('dailyResume.durationPlaceholder')} type="number" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={cardioForm.control}
                        name="distance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('dailyResume.distanceOptional')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('dailyResume.distancePlaceholder')} type="number" step="0.1" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={cardioForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('dailyResume.notesOptional')}</FormLabel>
                            <FormControl>
                              <Textarea placeholder={t('dailyResume.notesPlaceholder')} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCardioDialogOpen(false)}>
                          {t('dailyResume.cancel')}
                        </Button>
                        <Button type="submit" disabled={createCardioMutation.isPending}>
                          {createCardioMutation.isPending ? t('dailyResume.adding') : t('dailyResume.addActivity')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingCardio ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : cardioActivities && Array.isArray(cardioActivities) && cardioActivities.length > 0 ? (
              <div className="space-y-4">
                {cardioActivities.map((activity: any) => (
                  <div key={activity.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                          {activity.activityType}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {activity.duration} min
                          </div>
                          {activity.distance && (
                            <div>
                              {activity.distance} km
                            </div>
                          )}
                        </div>
                        {activity.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {activity.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteCardioMutation.mutate(activity.id)}
                        disabled={deleteCardioMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t('dailyResume.noCardioActivities')}</p>
                <p className="text-sm text-gray-400">{t('dailyResume.addActivitiesToTrack')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}