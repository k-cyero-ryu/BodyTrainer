import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FoodDropdownSelector } from "@/components/FoodDropdownSelector";
import { ArrowLeft, Plus, Trash2, Save, X } from "lucide-react";
import type { NutritionData } from "@shared/schema";

const mealPlanFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  goal: z.string().optional(),
  dailyCalories: z.number().min(1, "Daily calories required"),
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
  id: string;
  dayNumber: number;
  dayName: string;
  meals: MealData[];
  notes?: string;
}

export default function TrainerMealPlanEdit() {
  const [, params] = useRoute("/trainer-meal-plans/:id/edit");
  const planId = params?.id;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const MEAL_TYPES = [
    { value: "breakfast", label: t("mealPlans.mealTypes.breakfast") },
    { value: "lunch", label: t("mealPlans.mealTypes.lunch") },
    { value: "dinner", label: t("mealPlans.mealTypes.dinner") },
    { value: "snack", label: t("mealPlans.mealTypes.snack") },
    { value: "pre-workout", label: t("mealPlans.mealTypes.pre_workout") },
    { value: "post-workout", label: t("mealPlans.mealTypes.post_workout") },
    { value: "intra-workout", label: t("mealPlans.mealTypes.intra_workout") },
  ];

  const GOAL_OPTIONS = [
    { value: "weight_loss", label: t("mealPlans.goals.weight_loss") },
    { value: "muscle_gain", label: t("mealPlans.goals.muscle_gain") },
    { value: "maintenance", label: t("mealPlans.goals.maintenance") },
    { value: "endurance", label: t("mealPlans.goals.endurance") },
    { value: "strength", label: t("mealPlans.goals.strength") },
  ];

  const DAY_NAMES = [
    t("days.monday"),
    t("days.tuesday"),
    t("days.wednesday"),
    t("days.thursday"),
    t("days.friday"),
    t("days.saturday"),
    t("days.sunday"),
  ];
  const [daysData, setDaysData] = useState<DayData[]>([]);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [selectedFoodCategory, setSelectedFoodCategory] =
    useState<string>("all");
  const [modifiedMeals, setModifiedMeals] = useState<Set<string>>(new Set());
  const [modifiedItems, setModifiedItems] = useState<Set<string>>(new Set());

  const form = useForm<MealPlanFormData>({
    resolver: zodResolver(mealPlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      dailyCalories: 2000,
      targetProtein: 150,
      targetCarbs: 200,
      targetFat: 60,
      notes: "",
    },
  });

  const { data: mealPlan, isLoading } = useQuery<any>({
    queryKey: ["/api/nutrition/meal-plans", planId],
    enabled: !!planId,
  });

  const { data: mealDays = [] } = useQuery<any[]>({
    queryKey: [`/api/nutrition/meal-plans/${planId}/days`],
    enabled: !!planId,
  });

  useEffect(() => {
    if (mealPlan) {
      form.reset({
        name: mealPlan.name || "",
        description: mealPlan.description || "",
        goal: mealPlan.goal || "",
        dailyCalories: mealPlan.dailyCalories || 2000,
        targetProtein: mealPlan.targetProtein || 150,
        targetCarbs: mealPlan.targetCarbs || 200,
        targetFat: mealPlan.targetFat || 60,
        notes: mealPlan.notes || "",
      });
    }
  }, [mealPlan, form]);

  useEffect(() => {
    if (mealDays && mealDays.length > 0) {
      const daysWithMeals = mealDays.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        notes: day.notes || "",
        meals: (day.meals || []).map((meal: any) => ({
          id: meal.id,
          mealType: meal.mealType,
          name: meal.name || "",
          targetTime: meal.targetTime || "",
          notes: meal.notes || "",
          items: (meal.items || []).map((item: any) => ({
            id: item.id,
            foodName: item.foodName,
            fdcId: item.fdcId || "",
            quantity: parseFloat(item.quantity || "0"),
            calories: parseFloat(item.calories || "0"),
            protein: parseFloat(item.protein || "0"),
            carbs: parseFloat(item.carbs || "0"),
            fat: parseFloat(item.fat || "0"),
            notes: item.notes || "",
          })),
        })),
      }));
      setDaysData(daysWithMeals);
      setModifiedMeals(new Set()); // Clear modifications when loading fresh data
      setModifiedItems(new Set());
    }
  }, [mealDays]);

  const updateMealPlanMutation = useMutation({
    mutationFn: async (data: MealPlanFormData) => {
      await apiRequest("PATCH", `/api/nutrition/meal-plans/${planId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal plan updated successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/nutrition/meal-plans", planId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/nutrition/trainers/${(user as any)?.trainer?.id}/meal-plans`,
        ],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meal plan",
        variant: "destructive",
      });
    },
  });

  const addMealMutation = useMutation({
    mutationFn: async (data: { dayId: string; mealType: string }) => {
      const response = await apiRequest("POST", `/api/nutrition/meals`, {
        mealDayId: data.dayId,
        mealType: data.mealType,
        totalCalories: 0,
        totalProtein: "0",
        totalCarbs: "0",
        totalFat: "0",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/nutrition/meal-plans/${planId}/days`],
      });
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (mealId: string) => {
      await apiRequest("DELETE", `/api/nutrition/meals/${mealId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/nutrition/meal-plans/${planId}/days`],
      });
    },
  });

  const updateMealMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      await apiRequest(
        "PATCH",
        `/api/nutrition/meals/${data.id}`,
        data.updates,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/nutrition/meal-plans/${planId}/days`],
      });
    },
  });

  const addMealItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST",
        `/api/nutrition/meal-items`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/nutrition/meal-plans/${planId}/days`],
      });
    },
  });

  const updateMealItemMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      await apiRequest(
        "PATCH",
        `/api/nutrition/meal-items/${data.id}`,
        data.updates,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/nutrition/meal-plans/${planId}/days`],
      });
    },
  });

  const deleteMealItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/nutrition/meal-items/${itemId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/nutrition/meal-plans/${planId}/days`],
      });
    },
  });

  const handleAddMeal = (dayId: string) => {
    addMealMutation.mutate({ dayId, mealType: "breakfast" });
  };

  const handleDeleteMeal = (mealId: string) => {
    deleteMealMutation.mutate(mealId);
  };

  const handleUpdateMeal = (mealId: string, updates: any) => {
    // Update local state only
    setDaysData((prev) =>
      prev.map((day) => ({
        ...day,
        meals: day.meals.map((meal) =>
          meal.id === mealId ? { ...meal, ...updates } : meal,
        ),
      })),
    );
    // Track as modified
    setModifiedMeals((prev) => new Set(prev).add(mealId));
  };

  const handleAddFoodToMeal = (
    mealId: string,
    data: {
      food: NutritionData;
      quantity: number;
      calculatedCalories: number;
      calculatedNutrition: NutritionData;
    },
  ) => {
    addMealItemMutation.mutate({
      mealId,
      foodName: data.food.name || "Unknown Food",
      fdcId: data.food.fdcId.toString(),
      quantity: data.quantity.toString(),
      unit: "g",
      calories: (data.food.calories || 0).toString(),
      protein: (data.food.protein || 0).toString(),
      carbs: (data.food.carbs || 0).toString(),
      fat: (data.food.totalFat || 0).toString(),
    });
  };

  const handleUpdateMealItem = (itemId: string, updates: any) => {
    // Update local state only
    setDaysData((prev) =>
      prev.map((day) => ({
        ...day,
        meals: day.meals.map((meal) => ({
          ...meal,
          items: meal.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item,
          ),
        })),
      })),
    );
    // Track as modified
    setModifiedItems((prev) => new Set(prev).add(itemId));
  };

  const handleDeleteMealItem = (itemId: string) => {
    deleteMealItemMutation.mutate(itemId);
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

  const onSubmit = async (data: MealPlanFormData) => {
    try {
      // Save plan metadata
      await apiRequest("PATCH", `/api/nutrition/meal-plans/${planId}`, data);

      // Save all modified meals
      const mealSavePromises = Array.from(modifiedMeals).map((mealId) => {
        const meal = daysData
          .flatMap((d) => d.meals)
          .find((m) => m.id === mealId);
        if (meal) {
          return apiRequest("PATCH", `/api/nutrition/meals/${mealId}`, {
            mealType: meal.mealType,
            name: meal.name,
            targetTime: meal.targetTime,
            notes: meal.notes,
          });
        }
        return Promise.resolve();
      });

      // Save all modified items
      const itemSavePromises = Array.from(modifiedItems).map((itemId) => {
        const item = daysData
          .flatMap((d) => d.meals)
          .flatMap((m) => m.items)
          .find((i) => i.id === itemId);
        if (item) {
          return apiRequest("PATCH", `/api/nutrition/meal-items/${itemId}`, {
            quantity: item.quantity.toString(),
            calories: item.calories?.toString(),
            protein: item.protein?.toString(),
            carbs: item.carbs?.toString(),
            fat: item.fat?.toString(),
            notes: item.notes,
          });
        }
        return Promise.resolve();
      });

      await Promise.all([...mealSavePromises, ...itemSavePromises]);

      // Clear modifications and invalidate queries
      setModifiedMeals(new Set());
      setModifiedItems(new Set());
      queryClient.invalidateQueries({
        queryKey: ["/api/nutrition/meal-plans", planId],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/nutrition/meal-plans/${planId}/days`],
      });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/nutrition/trainers/${(user as any)?.trainer?.id}/meal-plans`,
        ],
      });

      toast({
        title: "Success",
        description: `Plan, ${modifiedMeals.size} meal(s), and ${modifiedItems.size} item(s) updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update meal plan",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">Meal plan not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/trainer-meal-plans")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("mealPlans.editPlan")}</h1>
          <p className="text-muted-foreground">
            {t("mealPlans.updatePlanDetails")}
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("mealPlans.planDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("mealPlans.planName")}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-plan-name" />
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
                      <FormLabel>Goal</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-goal">
                            <SelectValue placeholder="Select goal" />
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
                      <FormLabel>{t("mealPlans.dailyCalories")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          data-testid="input-daily-calories"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetProtein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("mealPlans.targetProtein")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
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
                      <FormLabel>{t("mealPlans.targetCarbs")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
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
                      <FormLabel>{t("mealPlans.targetFat")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
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
                    <FormLabel>{t("mealPlans.description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={2}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("mealPlans.notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={2}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                data-testid="button-save-plan"
                disabled={updateMealPlanMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMealPlanMutation.isPending
                  ? t("mealPlans.saving")
                  : t("mealPlans.savePlanDetails")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("mealPlans.weeklyMeals")}</CardTitle>
          <CardDescription>
            {t("mealPlans.manageMealsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeDay.toString()}
            onValueChange={(v) => setActiveDay(parseInt(v))}
          >
            <TabsList className="grid grid-cols-7 w-full mb-4">
              {DAY_NAMES.map((day, index) => (
                <TabsTrigger
                  key={index + 1}
                  value={(index + 1).toString()}
                  data-testid={`tab-day-${index + 1}`}
                >
                  {day.slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>
            {daysData.map((day) => {
              const totals = calculateDayTotals(day);
              return (
                <TabsContent
                  key={day.dayNumber}
                  value={day.dayNumber.toString()}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{day.dayName}</h3>
                      <div className="text-sm text-muted-foreground">
                        {t("mealPlans.total")}: {totals.calories}{" "}
                        {t("mealPlans.cal")} | {t("mealPlans.proteinShort")}:{" "}
                        {totals.protein}g | {t("mealPlans.carbsShort")}:{" "}
                        {totals.carbs}g | {t("mealPlans.fatShort")}:{" "}
                        {totals.fat}g
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddMeal(day.id)}
                      size="sm"
                      data-testid={`button-add-meal-day-${day.dayNumber}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("mealPlans.addMeal")}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {day.meals.map((meal, mealIndex) => {
                      const mealTotals = meal.items.reduce(
                        (acc, item) => {
                          const multiplier = item.quantity / 100;
                          return {
                            calories:
                              acc.calories + (item.calories || 0) * multiplier,
                            protein:
                              acc.protein + (item.protein || 0) * multiplier,
                            carbs: acc.carbs + (item.carbs || 0) * multiplier,
                            fat: acc.fat + (item.fat || 0) * multiplier,
                          };
                        },
                        { calories: 0, protein: 0, carbs: 0, fat: 0 },
                      );

                      return (
                        <Card key={meal.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={meal.mealType}
                                    onValueChange={(value) =>
                                      handleUpdateMeal(meal.id, {
                                        mealType: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger
                                      className="w-48"
                                      data-testid={`select-meal-type-${mealIndex}`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {MEAL_TYPES.map((type) => (
                                        <SelectItem
                                          key={type.value}
                                          value={type.value}
                                        >
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder={t("mealPlans.mealName")}
                                    value={meal.name || ""}
                                    onChange={(e) =>
                                      handleUpdateMeal(meal.id, {
                                        name: e.target.value,
                                      })
                                    }
                                    data-testid={`input-meal-name-${mealIndex}`}
                                  />
                                  <Input
                                    type="time"
                                    placeholder={t("mealPlans.targetTime")}
                                    value={meal.targetTime || ""}
                                    onChange={(e) =>
                                      handleUpdateMeal(meal.id, {
                                        targetTime: e.target.value,
                                      })
                                    }
                                    data-testid={`input-meal-time-${mealIndex}`}
                                  />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {Math.round(mealTotals.calories)}{" "}
                                  {t("mealPlans.cal")} |{" "}
                                  {t("mealPlans.proteinShort")}:{" "}
                                  {Math.round(mealTotals.protein)}g |{" "}
                                  {t("mealPlans.carbsShort")}:{" "}
                                  {Math.round(mealTotals.carbs)}g |{" "}
                                  {t("mealPlans.fatShort")}:{" "}
                                  {Math.round(mealTotals.fat)}g
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMeal(meal.id)}
                                data-testid={`button-delete-meal-${mealIndex}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {meal.items.map((item, itemIndex) => {
                              const itemTotalCalories =
                                (item.calories || 0) * (item.quantity / 100);
                              const itemTotalProtein =
                                (item.protein || 0) * (item.quantity / 100);
                              const itemTotalCarbs =
                                (item.carbs || 0) * (item.quantity / 100);
                              const itemTotalFat =
                                (item.fat || 0) * (item.quantity / 100);

                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {item.foodName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {item.quantity}g |{" "}
                                      {Math.round(itemTotalCalories)}{" "}
                                      {t("mealPlans.cal")} |{" "}
                                      {t("mealPlans.proteinShort")}:{" "}
                                      {Math.round(itemTotalProtein)}g |{" "}
                                      {t("mealPlans.carbsShort")}:{" "}
                                      {Math.round(itemTotalCarbs)}g |{" "}
                                      {t("mealPlans.fatShort")}:{" "}
                                      {Math.round(itemTotalFat)}g
                                    </div>
                                  </div>
                                  <Input
                                    type="number"
                                    className="w-24"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleUpdateMealItem(item.id, {
                                        quantity: e.target.value,
                                      })
                                    }
                                    data-testid={`input-item-quantity-${mealIndex}-${itemIndex}`}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleDeleteMealItem(item.id)
                                    }
                                    data-testid={`button-delete-item-${mealIndex}-${itemIndex}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}

                            <FoodDropdownSelector
                              onFoodSelect={(data) =>
                                handleAddFoodToMeal(meal.id, data)
                              }
                              selectedCategory={selectedFoodCategory}
                              onCategoryChange={setSelectedFoodCategory}
                            />

                            <Textarea
                              placeholder={t("mealPlans.mealNotesPlaceholder")}
                              value={meal.notes || ""}
                              onChange={(e) =>
                                handleUpdateMeal(meal.id, {
                                  notes: e.target.value,
                                })
                              }
                              rows={2}
                              data-testid={`textarea-meal-notes-${mealIndex}`}
                            />
                          </CardContent>
                        </Card>
                      );
                    })}

                    {day.meals.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {t("mealPlans.noMealsAddedYet")}
                      </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
