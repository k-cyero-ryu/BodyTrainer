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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FoodDropdownSelector } from "@/components/FoodDropdownSelector";
import type { NutritionData } from "@shared/schema";
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
  Trash
} from "lucide-react";
import type { MealPlan, Client, InsertMealPlan } from "@shared/schema";

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
  dayNumber: number;
  dayName: string;
  meals: MealData[];
  notes?: string;
}

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "pre-workout", label: "Pre-Workout" },
  { value: "post-workout", label: "Post-Workout" },
  { value: "intra-workout", label: "Intra-Workout" },
];

const GOAL_OPTIONS = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "maintenance", label: "Maintenance" },
  { value: "endurance", label: "Endurance" },
  { value: "strength", label: "Strength" },
];

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TrainerMealPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
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
        title: "Success",
        description: "Meal plan created successfully",
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

  const handleDeleteClick = (planId: string) => {
    setDeleteMealPlanId(planId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteMealPlanId) {
      deleteMealPlanMutation.mutate(deleteMealPlanId);
    }
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
        title: "Error",
        description: "Please add at least one meal to the plan",
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
          <h1 className="text-3xl font-bold">Meal Plan Templates</h1>
          <p className="text-muted-foreground">Create reusable meal plan templates and assign them to clients</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-meal-plan">
              <Plus className="h-4 w-4 mr-2" />
              Create Meal Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-meal-plan">
            <DialogHeader>
              <DialogTitle>Create New Meal Plan Template</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Weight Loss Plan Week 1" data-testid="input-plan-name" />
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
                        <Select value={field.value} onValueChange={field.onChange}>
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
                        <FormLabel>Daily Calories</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                        <FormLabel>Target Protein (g)</FormLabel>
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
                        <FormLabel>Target Carbs (g)</FormLabel>
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
                        <FormLabel>Target Fat (g)</FormLabel>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="textarea-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Weekly Meal Planning</h3>
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
                                <CardDescription>Day {day.dayNumber}</CardDescription>
                              </div>
                              <div className="text-right">
                                {(() => {
                                  const totals = calculateDayTotals(day);
                                  return (
                                    <div className="space-y-1">
                                      <div className="text-sm font-semibold" data-testid={`text-day-calories-${day.dayNumber}`}>
                                        {totals.calories} cal
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        P: {totals.protein}g | C: {totals.carbs}g | F: {totals.fat}g
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
                                        placeholder="Meal name (optional)"
                                        value={meal.name || ""}
                                        onChange={(e) =>
                                          updateMeal(day.dayNumber, meal.id, { name: e.target.value })
                                        }
                                        className="flex-1"
                                        data-testid={`input-meal-name-${meal.id}`}
                                      />
                                      <Input
                                        placeholder="Time (e.g., 8:00 AM)"
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
                                          {item.foodName || "Unknown Food"} ({item.quantity}g)
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {Math.round((item.calories || 0) * (item.quantity / 100))} cal | P:{" "}
                                          {Math.round((item.protein || 0) * (item.quantity / 100))}g | C:{" "}
                                          {Math.round((item.carbs || 0) * (item.quantity / 100))}g | F:{" "}
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
                              Add Meal
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
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMealPlanMutation.isPending}
                    data-testid="button-save-meal-plan"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createMealPlanMutation.isPending ? "Saving..." : "Save Meal Plan"}
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
                  {plan.isTemplate && <Badge variant="secondary">Template</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Calories:</span>
                    <span className="font-medium">{plan.dailyCalories} cal</span>
                  </div>
                  {plan.targetProtein && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Protein:</span>
                      <span className="font-medium">{plan.targetProtein}g</span>
                    </div>
                  )}
                  {plan.targetCarbs && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Carbs:</span>
                      <span className="font-medium">{plan.targetCarbs}g</span>
                    </div>
                  )}
                  {plan.targetFat && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fat:</span>
                      <span className="font-medium">{plan.targetFat}g</span>
                    </div>
                  )}
                  {plan.goal && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Goal:</span>
                      <Badge variant="outline">{plan.goal}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Link href={`/trainer-meal-plans/${plan.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    data-testid={`button-view-plan-${plan.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(plan.id)}
                  className="flex-1"
                  data-testid={`button-delete-plan-${plan.id}`}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
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
    </div>
  );
}
