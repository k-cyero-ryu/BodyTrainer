import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { FoodDropdownSelector } from "@/components/FoodDropdownSelector";
import { TDEECalculatorDialog } from "@/components/TDEECalculatorDialog";
import type { NutritionData } from "@shared/schema";
import { applyAdjustment } from "@/lib/tdeeCalculator";
import { 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Save, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  Eye,
  Edit,
  Trash,
  Copy,
  MoreVertical
} from "lucide-react";
import type { MealPlan, Client, InsertMealPlan } from "@shared/schema";

const mealPlanFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  goal: z.string().optional(),
  dailyCalories: z.number().min(1, "Daily calories required"),
  adjustedDailyCalories: z.number().optional(),
  adjustmentPercentage: z.number().min(-100).max(100).default(0),
  targetProtein: z.number().optional(),
  targetCarbs: z.number().optional(),
  targetFat: z.number().optional(),
  notes: z.string().optional(),
});

type MealPlanFormData = z.infer<typeof mealPlanFormSchema>;

interface MealItemData {
  id: string;
  foodName: string;
  fdcId?: string;
  quantity: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
}

interface MealData {
  id: string;
  mealType: string;
  name?: string;
  targetTime?: string;
  items: MealItemData[];
  notes?: string;
}

interface DayData {
  dayNumber: number;
  dayName: string;
  meals: MealData[];
  notes?: string;
}

export default function TrainerMealPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const MEAL_TYPES = [
    { value: "breakfast", label: t('mealPlans.mealTypes.breakfast') },
    { value: "lunch", label: t('mealPlans.mealTypes.lunch') },
    { value: "dinner", label: t('mealPlans.mealTypes.dinner') },
    { value: "snack", label: t('mealPlans.mealTypes.snack') },
    { value: "pre_workout", label: t('mealPlans.mealTypes.pre_workout') },
    { value: "post_workout", label: t('mealPlans.mealTypes.post_workout') },
    { value: "intra_workout", label: t('mealPlans.mealTypes.intra_workout') },
  ];

  const GOAL_OPTIONS = [
    { value: "weight_loss", label: t('mealPlans.goals.weight_loss') },
    { value: "muscle_gain", label: t('mealPlans.goals.muscle_gain') },
    { value: "maintenance", label: t('mealPlans.goals.maintenance') },
    { value: "endurance", label: t('mealPlans.goals.endurance') },
    { value: "strength", label: t('mealPlans.goals.strength') },
  ];

  const DAY_NAMES = [
    t('days.monday'),
    t('days.tuesday'),
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday'),
    t('days.saturday'),
    t('days.sunday')
  ];
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [daysData, setDaysData] = useState<DayData[]>(
    DAY_NAMES.map((name, index) => ({
      dayNumber: index + 1,
      dayName: name,
      meals: [],
      notes: "",
    }))
  );
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [activeDay, setActiveDay] = useState<number>(1);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>('all');
  const [deleteMealPlanId, setDeleteMealPlanId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTDEECalculator, setShowTDEECalculator] = useState(false);

  const form = useForm<MealPlanFormData>({
    resolver: zodResolver(mealPlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      dailyCalories: 2000,
      adjustedDailyCalories: 2000,
      adjustmentPercentage: 0,
      targetProtein: 150,
      targetCarbs: 200,
      targetFat: 60,
      notes: "",
    },
  });

  const { data: clientsData } = useQuery<{ clients: Client[] }>({
    queryKey: ["/api/trainers/clients"],
    enabled: !!user && user.role === "trainer",
  });
  
  const clients = clientsData?.clients || [];

  const { data: mealPlans = [] } = useQuery<MealPlan[]>({
    queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/meal-plans`],
    enabled: !!user?.trainer?.id,
  });

  const createMealPlanMutation = useMutation({
    mutationFn: async (data: { plan: MealPlanFormData; days: DayData[] }) => {
      const planResponseRaw = await apiRequest("POST", `/api/nutrition/meal-plans`, {
        ...data.plan,
        trainerId: user?.trainer?.id,
        isTemplate: true,
      });
      const planResponse = await planResponseRaw.json();

      for (const day of data.days) {
        const dayResponseRaw = await apiRequest("POST", `/api/nutrition/meal-days`, {
          mealPlanId: planResponse.id,
          dayNumber: day.dayNumber,
          dayName: day.dayName,
          notes: day.notes,
          totalCalories: 0,
          totalProtein: "0",
          totalCarbs: "0",
          totalFat: "0",
        });
        const dayResponse = await dayResponseRaw.json();

        for (const meal of day.meals) {
          const mealResponseRaw = await apiRequest("POST", `/api/nutrition/meals`, {
            mealDayId: dayResponse.id,
            mealType: meal.mealType,
            name: meal.name,
            targetTime: meal.targetTime,
            notes: meal.notes,
            totalCalories: 0,
            totalProtein: "0",
            totalCarbs: "0",
            totalFat: "0",
          });
          const mealResponse = await mealResponseRaw.json();

          for (const item of meal.items) {
            await apiRequest("POST", `/api/nutrition/meal-items`, {
              mealId: mealResponse.id,
              foodName: item.foodName,
              fdcId: item.fdcId,
              quantity: item.quantity.toString(),
              unit: "g",
              calories: item.calories?.toString(),
              protein: item.protein?.toString(),
              carbs: item.carbs?.toString(),
              fat: item.fat?.toString(),
              notes: item.notes,
            });
          }
        }
      }

      return planResponse;
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('mealPlans.mealPlanCreatedSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/meal-plans`] });
      setShowCreateDialog(false);
      form.reset();
      setDaysData(
        DAY_NAMES.map((name, index) => ({
          dayNumber: index + 1,
          dayName: name,
          meals: [],
          notes: "",
        }))
      );
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create meal plan",
        variant: "destructive",
      });
    },
  });

  const deleteMealPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      await apiRequest("DELETE", `/api/nutrition/meal-plans/${planId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/meal-plans`] });
      setShowDeleteDialog(false);
      setDeleteMealPlanId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal plan",
        variant: "destructive",
      });
    },
  });

  const copyMealPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", `/api/nutrition/meal-plans/${planId}/copy`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal plan copied successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/meal-plans`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to copy meal plan",
        variant: "destructive",
      });
    },
  });

  const updateMealPlanMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<MealPlanFormData> }) => {
      const response = await apiRequest("PATCH", `/api/nutrition/meal-plans/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal plan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/meal-plans`] });
      setShowEditDialog(false);
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meal plan",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (planId: string) => {
    setDeleteMealPlanId(planId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteMealPlanId) {
      deleteMealPlanMutation.mutate(deleteMealPlanId);
    }
  };

  const handleEditClick = (plan: MealPlan) => {
    setEditingPlan(plan);
    setShowEditDialog(true);
  };

  const handleCopyClick = (planId: string) => {
    copyMealPlanMutation.mutate(planId);
  };

  const handleApplyTDEE = (tdee: number) => {
    form.setValue('dailyCalories', tdee);
    form.setValue('adjustedDailyCalories', tdee);
    form.setValue('adjustmentPercentage', 0);
  };

  const handleAdjustmentChange = (percentage: number) => {
    const baseTDEE = form.getValues('dailyCalories');
    const adjustedCalories = applyAdjustment(baseTDEE, percentage);
    form.setValue('adjustmentPercentage', percentage);
    form.setValue('adjustedDailyCalories', adjustedCalories);
  };

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) {
        newSet.delete(dayNumber);
      } else {
        newSet.add(dayNumber);
      }
      return newSet;
    });
  };

  const addMeal = (dayNumber: number) => {
    setDaysData((prev) =>
      prev.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              meals: [
                ...day.meals,
                {
                  id: `meal-${Date.now()}`,
                  mealType: "breakfast",
                  items: [],
                },
              ],
            }
          : day
      )
    );
  };

  const removeMeal = (dayNumber: number, mealId: string) => {
    setDaysData((prev) =>
      prev.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              meals: day.meals.filter((meal) => meal.id !== mealId),
            }
          : day
      )
    );
  };

  const updateMeal = (dayNumber: number, mealId: string, updates: Partial<MealData>) => {
    setDaysData((prev) =>
      prev.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealId ? { ...meal, ...updates } : meal
              ),
            }
          : day
      )
    );
  };

  const addFoodToMeal = (dayNumber: number, mealId: string, data: {
    food: NutritionData;
    quantity: number;
    calculatedCalories: number;
    calculatedNutrition: NutritionData;
  }) => {
    // Store per-100g values so we can recalculate when quantity changes
    const newItem: MealItemData = {
      id: `item-${Date.now()}`,
      foodName: data.food.name || "Unknown Food",
      fdcId: data.food.fdcId.toString(),
      quantity: data.quantity,
      // Store per-100g values (original USDA data)
      calories: data.food.calories || 0,
      protein: data.food.protein || 0,
      carbs: data.food.carbs || 0,
      fat: data.food.totalFat || 0,
    };

    setDaysData((prev) =>
      prev.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealId
                  ? { ...meal, items: [...meal.items, newItem] }
                  : meal
              ),
            }
          : day
      )
    );
  };

  const updateMealItem = (
    dayNumber: number,
    mealId: string,
    itemId: string,
    updates: Partial<MealItemData>
  ) => {
    setDaysData((prev) =>
      prev.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealId
                  ? {
                      ...meal,
                      items: meal.items.map((item) =>
                        item.id === itemId ? { ...item, ...updates } : item
                      ),
                    }
                  : meal
              ),
            }
          : day
      )
    );
  };

  const removeMealItem = (dayNumber: number, mealId: string, itemId: string) => {
    setDaysData((prev) =>
      prev.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === mealId
                  ? {
                      ...meal,
                      items: meal.items.filter((item) => item.id !== itemId),
                    }
                  : meal
              ),
            }
          : day
      )
    );
  };

  const calculateDayTotals = (day: DayData) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    day.meals.forEach((meal) => {
      meal.items.forEach((item) => {
        const multiplier = item.quantity / 100;
        totalCalories += (item.calories || 0) * multiplier;
        totalProtein += (item.protein || 0) * multiplier;
        totalCarbs += (item.carbs || 0) * multiplier;
        totalFat += (item.fat || 0) * multiplier;
      });
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
    };
  };

  const onSubmit = (data: MealPlanFormData) => {
    if (daysData.every((day) => day.meals.length === 0)) {
      toast({
        title: t('common.error'),
        description: t('mealPlans.addAtLeastOneMeal'),
        variant: "destructive",
      });
      return;
    }

    createMealPlanMutation.mutate({ plan: data, days: daysData });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('mealPlans.planTemplates')}</h1>
          <p className="text-muted-foreground">{t('mealPlans.createReusable')}</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-meal-plan">
              <Plus className="h-4 w-4 mr-2" />
              {t('mealPlans.createPlanTemplate')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-meal-plan">
            <DialogHeader>
              <DialogTitle>{t('mealPlans.createMealPlan')}</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('mealPlans.planName')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('mealPlans.planNamePlaceholder')} data-testid="input-plan-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('mealPlans.goal')}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-goal">
                              <SelectValue placeholder={t('mealPlans.selectGoal')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GOAL_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dailyCalories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('mealPlans.dailyCalories')} (TDEE)</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-daily-calories"
                              readOnly
                              className="bg-gray-50 dark:bg-gray-800"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowTDEECalculator(true)}
                            data-testid="button-calculate-tdee"
                          >
                            {t('tdee.calculator')}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adjustedDailyCalories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('mealPlans.adjustedDailyCalories')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            data-testid="input-adjusted-calories"
                            readOnly
                            className="bg-gray-50 dark:bg-gray-800"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="adjustmentPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('mealPlans.adjustmentPercentage')}: {field.value}%
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={-100}
                            max={100}
                            step={5}
                            value={[field.value || 0]}
                            onValueChange={(value) => handleAdjustmentChange(value[0])}
                            data-testid="slider-adjustment"
                            className="w-full"
                          />
                        </FormControl>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>-100%</span>
                          <span>0%</span>
                          <span>+100%</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <FormField
                    control={form.control}
                    name="targetProtein"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('mealPlans.targetProtein')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-target-protein"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetCarbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('mealPlans.targetCarbs')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-target-carbs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetFat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('mealPlans.targetFat')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-target-fat"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('mealPlans.description')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="textarea-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('mealPlans.weeklyMealPlanning')}</h3>
                  <Tabs value={activeDay.toString()} onValueChange={(v) => setActiveDay(parseInt(v))}>
                    <TabsList className="grid grid-cols-7 w-full">
                      {DAY_NAMES.map((day, index) => (
                        <TabsTrigger key={index + 1} value={(index + 1).toString()} data-testid={`tab-day-${index + 1}`}>
                          {day.slice(0, 3)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {daysData.map((day) => (
                      <TabsContent key={day.dayNumber} value={day.dayNumber.toString()} className="space-y-4">
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>{day.dayName}</CardTitle>
                                <CardDescription>{t('mealPlans.day')} {day.dayNumber}</CardDescription>
                              </div>
                              <div className="text-right">
                                {(() => {
                                  const totals = calculateDayTotals(day);
                                  return (
                                    <div className="space-y-1">
                                      <div className="text-sm font-semibold" data-testid={`text-day-calories-${day.dayNumber}`}>
                                        {totals.calories} {t('mealPlans.cal')}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {t('mealPlans.proteinShort')}: {totals.protein}g | {t('mealPlans.carbsShort')}: {totals.carbs}g | {t('mealPlans.fatShort')}: {totals.fat}g
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {day.meals.map((meal) => (
                              <Card key={meal.id} data-testid={`card-meal-${meal.id}`}>
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex gap-2 flex-1">
                                      <Select
                                        value={meal.mealType}
                                        onValueChange={(value) =>
                                          updateMeal(day.dayNumber, meal.id, { mealType: value })
                                        }
                                      >
                                        <SelectTrigger className="w-40" data-testid={`select-meal-type-${meal.id}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {MEAL_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                              {type.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        placeholder={t('mealPlans.mealName')}
                                        value={meal.name || ""}
                                        onChange={(e) =>
                                          updateMeal(day.dayNumber, meal.id, { name: e.target.value })
                                        }
                                        className="flex-1"
                                        data-testid={`input-meal-name-${meal.id}`}
                                      />
                                      <Input
                                        placeholder={t('mealPlans.timePlaceholder')}
                                        value={meal.targetTime || ""}
                                        onChange={(e) =>
                                          updateMeal(day.dayNumber, meal.id, { targetTime: e.target.value })
                                        }
                                        className="w-32"
                                        data-testid={`input-meal-time-${meal.id}`}
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeMeal(day.dayNumber, meal.id)}
                                      data-testid={`button-remove-meal-${meal.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  {meal.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-2 p-2 border rounded"
                                      data-testid={`row-meal-item-${item.id}`}
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">
                                          {item.foodName || t('mealPlans.unknownFood')} ({item.quantity}g)
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {Math.round((item.calories || 0) * (item.quantity / 100))} {t('mealPlans.cal')} | {t('mealPlans.proteinShort')}:{" "}
                                          {Math.round((item.protein || 0) * (item.quantity / 100))}g | {t('mealPlans.carbsShort')}:{" "}
                                          {Math.round((item.carbs || 0) * (item.quantity / 100))}g | {t('mealPlans.fatShort')}:{" "}
                                          {Math.round((item.fat || 0) * (item.quantity / 100))}g
                                        </div>
                                      </div>
                                      <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateMealItem(day.dayNumber, meal.id, item.id, {
                                            quantity: parseInt(e.target.value) || 0,
                                          })
                                        }
                                        className="w-20"
                                        data-testid={`input-item-quantity-${item.id}`}
                                      />
                                      <span className="text-xs">g</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeMealItem(day.dayNumber, meal.id, item.id)}
                                        data-testid={`button-remove-item-${item.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  <div className="border-t pt-4">
                                    <FoodDropdownSelector
                                      onFoodSelect={(data) => {
                                        addFoodToMeal(day.dayNumber, meal.id, data);
                                      }}
                                      selectedCategory={selectedFoodCategory}
                                      onCategoryChange={setSelectedFoodCategory}
                                      hideTitle={true}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => addMeal(day.dayNumber)}
                              className="w-full"
                              data-testid={`button-add-meal-day-${day.dayNumber}`}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {t('mealPlans.addMeal')}
                            </Button>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMealPlanMutation.isPending}
                    data-testid="button-save-meal-plan"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createMealPlanMutation.isPending ? t('mealPlans.saving') : t('mealPlans.saveMealPlan')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mealPlans.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No meal plans yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first meal plan to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          mealPlans.map((plan) => (
            <Card key={plan.id} data-testid={`card-meal-plan-${plan.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {plan.description || "Meal plan template"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.isTemplate && <Badge variant="secondary">{t('common.template')}</Badge>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-menu-${plan.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(plan)} data-testid={`menu-edit-${plan.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('mealPlans.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleCopyClick(plan.id)} 
                          disabled={copyMealPlanMutation.isPending}
                          data-testid={`menu-copy-${plan.id}`}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {t('mealPlans.copy')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(plan.id)} data-testid={`menu-delete-${plan.id}`}>
                          <Trash className="h-4 w-4 mr-2 text-destructive" />
                          <span className="text-destructive">{t('mealPlans.delete')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('mealPlans.dailyCalories')}:</span>
                    <span className="font-medium">{plan.dailyCalories} {t('mealPlans.calories')}</span>
                  </div>
                  {plan.targetProtein && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('mealPlans.protein')}:</span>
                      <span className="font-medium">{plan.targetProtein}g</span>
                    </div>
                  )}
                  {plan.targetCarbs && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('mealPlans.carbs')}:</span>
                      <span className="font-medium">{plan.targetCarbs}g</span>
                    </div>
                  )}
                  {plan.targetFat && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('mealPlans.fat')}:</span>
                      <span className="font-medium">{plan.targetFat}g</span>
                    </div>
                  )}
                  {plan.goal && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('mealPlans.goal')}:</span>
                      <Badge variant="outline">{t(`mealPlans.goals.${plan.goal}`)}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/trainer-meal-plans/${plan.id}`} className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    data-testid={`button-view-plan-${plan.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t('mealPlans.viewDetails')}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this meal plan template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Meal Plan Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Meal Plan</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const dailyCalories = Number(formData.get('dailyCalories'));
                const adjustedCalories = Number(formData.get('adjustedDailyCalories')) || dailyCalories;
                const adjustmentPercentage = Math.round(((adjustedCalories - dailyCalories) / dailyCalories) * 100);
                
                const updates = {
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  goal: formData.get('goal') as string,
                  dailyCalories,
                  adjustedDailyCalories: adjustedCalories,
                  adjustmentPercentage,
                  targetProtein: Number(formData.get('targetProtein')) || undefined,
                  targetCarbs: Number(formData.get('targetCarbs')) || undefined,
                  targetFat: Number(formData.get('targetFat')) || undefined,
                  notes: formData.get('notes') as string,
                };
                updateMealPlanMutation.mutate({ id: editingPlan.id, updates });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingPlan.name}
                  required
                  data-testid="input-edit-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingPlan.description || ''}
                  rows={2}
                  data-testid="textarea-edit-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-goal">Goal</Label>
                  <Select name="goal" defaultValue={editingPlan.goal || ''}>
                    <SelectTrigger id="edit-goal" data-testid="select-edit-goal">
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-dailyCalories">Daily Calories (TDEE)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="edit-dailyCalories"
                      name="dailyCalories"
                      type="number"
                      defaultValue={editingPlan.dailyCalories}
                      required
                      data-testid="input-edit-dailyCalories"
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTDEECalculator(true)}
                      data-testid="button-edit-calculate-tdee"
                    >
                      {t('tdee.calculator')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-adjustedCalories">Adjusted Daily Calories</Label>
                  <Input
                    id="edit-adjustedCalories"
                    name="adjustedDailyCalories"
                    type="number"
                    defaultValue={editingPlan.adjustedDailyCalories || editingPlan.dailyCalories}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                    data-testid="input-edit-adjusted-calories"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Adjustment: {editingPlan.adjustmentPercentage || 0}%</Label>
                  <Slider
                    min={-100}
                    max={100}
                    step={5}
                    defaultValue={[editingPlan.adjustmentPercentage || 0]}
                    onValueChange={(value) => {
                      const adjusted = applyAdjustment(editingPlan.dailyCalories, value[0]);
                      const input = document.getElementById('edit-adjustedCalories') as HTMLInputElement;
                      if (input) input.value = adjusted.toString();
                    }}
                    data-testid="slider-edit-adjustment"
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>-100%</span>
                    <span>0%</span>
                    <span>+100%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-targetProtein">Protein (g)</Label>
                  <Input
                    id="edit-targetProtein"
                    name="targetProtein"
                    type="number"
                    defaultValue={editingPlan.targetProtein || ''}
                    data-testid="input-edit-targetProtein"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-targetCarbs">Carbs (g)</Label>
                  <Input
                    id="edit-targetCarbs"
                    name="targetCarbs"
                    type="number"
                    defaultValue={editingPlan.targetCarbs || ''}
                    data-testid="input-edit-targetCarbs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-targetFat">Fat (g)</Label>
                  <Input
                    id="edit-targetFat"
                    name="targetFat"
                    type="number"
                    defaultValue={editingPlan.targetFat || ''}
                    data-testid="input-edit-targetFat"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={editingPlan.notes || ''}
                  rows={2}
                  data-testid="textarea-edit-notes"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingPlan(null);
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMealPlanMutation.isPending}
                  data-testid="button-save-edit"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMealPlanMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* TDEE Calculator Dialog */}
      <TDEECalculatorDialog
        open={showTDEECalculator}
        onOpenChange={setShowTDEECalculator}
        clients={clients}
        onApplyTDEE={handleApplyTDEE}
      />
    </div>
  );
}
