import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Target, Flame, Edit } from "lucide-react";
import type { MealPlan, MealDay, Meal, MealItem } from "@shared/schema";

interface MealWithItems extends Meal {
  items: MealItem[];
}

interface DayWithMeals extends MealDay {
  meals: MealWithItems[];
}

interface CompleteMealPlan extends MealPlan {
  days: DayWithMeals[];
}

export default function TrainerMealPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeDay, setActiveDay] = useState(1);

  const getDayName = (dayName: string) => {
    const days: Record<string, string> = {
      'Monday': t('days.monday'),
      'Tuesday': t('days.tuesday'),
      'Wednesday': t('days.wednesday'),
      'Thursday': t('days.thursday'),
      'Friday': t('days.friday'),
      'Saturday': t('days.saturday'),
      'Sunday': t('days.sunday')
    };
    return days[dayName] || dayName;
  };

  const getMealTypeLabel = (mealType: string) => {
    const type = mealType.replace('-', '_');
    return t(`mealPlans.mealTypes.${type}`);
  };

  const { data: mealPlan, isLoading, error } = useQuery<CompleteMealPlan>({
    queryKey: ["/api/nutrition/meal-plans", id],
    queryFn: async () => {
      // Fetch base meal plan
      const planRes = await fetch(`/api/nutrition/meal-plans/${id}`);
      if (!planRes.ok) throw new Error("Failed to fetch meal plan");
      const plan: MealPlan = await planRes.json();

      // Fetch all days for this plan
      const daysRes = await fetch(`/api/nutrition/meal-plans/${id}/days`);
      if (!daysRes.ok) throw new Error("Failed to fetch meal days");
      const days: MealDay[] = await daysRes.json();

      // Fetch meals and items for each day in parallel
      const daysWithMeals = await Promise.all(
        days.map(async (day) => {
          const mealsRes = await fetch(`/api/nutrition/meal-days/${day.id}/meals`);
          if (!mealsRes.ok) throw new Error(`Failed to fetch meals for day ${day.dayNumber}`);
          const meals: Meal[] = await mealsRes.json();

          // Fetch items for each meal
          const mealsWithItems = await Promise.all(
            meals.map(async (meal) => {
              const itemsRes = await fetch(`/api/nutrition/meals/${meal.id}/items`);
              if (!itemsRes.ok) throw new Error(`Failed to fetch items for meal ${meal.id}`);
              const items: MealItem[] = await itemsRes.json();
              return { ...meal, items };
            })
          );

          return { ...day, meals: mealsWithItems };
        })
      );

      return { ...plan, days: daysWithMeals };
    },
    enabled: !!id,
  });

  const dayTotals = useMemo(() => {
    if (!mealPlan?.days) return {};
    
    return mealPlan.days.reduce((acc, day) => {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      day.meals.forEach((meal) => {
        meal.items.forEach((item) => {
          const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
          const multiplier = quantity / 100;
          totalCalories += (parseFloat(item.calories || "0") * multiplier);
          totalProtein += (parseFloat(item.protein || "0") * multiplier);
          totalCarbs += (parseFloat(item.carbs || "0") * multiplier);
          totalFat += (parseFloat(item.fat || "0") * multiplier);
        });
      });

      acc[day.dayNumber] = {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
      };

      return acc;
    }, {} as Record<number, { calories: number; protein: number; carbs: number; fat: number }>);
  }, [mealPlan]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !mealPlan) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/trainer-meal-plans">
          <Button variant="ghost" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('mealPlans.backToPlans')}
          </Button>
        </Link>
        <Card className="mt-6">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t('mealPlans.planNotFound')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedDays = [...mealPlan.days].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-meal-plan-detail">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/trainer-meal-plans">
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-plan-name">{mealPlan.name}</h1>
            {mealPlan.description && (
              <p className="text-muted-foreground mt-1">{mealPlan.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mealPlan.isTemplate && (
            <Badge variant="secondary" data-testid="badge-template">{t('common.template')}</Badge>
          )}
          <Link href={`/trainer-meal-plans/${id}/edit`}>
            <Button variant="outline" data-testid="button-edit-plan">
              <Edit className="h-4 w-4 mr-2" />
              {t('mealPlans.editPlan')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-daily-calories">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mealPlans.dailyTarget')}</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealPlan.dailyCalories} {t('mealPlans.cal')}</div>
          </CardContent>
        </Card>

        {mealPlan.targetProtein && (
          <Card data-testid="card-protein">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('mealPlans.protein')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mealPlan.targetProtein}g</div>
            </CardContent>
          </Card>
        )}

        {mealPlan.targetCarbs && (
          <Card data-testid="card-carbs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('mealPlans.carbs')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mealPlan.targetCarbs}g</div>
            </CardContent>
          </Card>
        )}

        {mealPlan.targetFat && (
          <Card data-testid="card-fat">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('mealPlans.fat')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mealPlan.targetFat}g</div>
            </CardContent>
          </Card>
        )}
      </div>

      {mealPlan.goal && (
        <div>
          <span className="text-sm font-medium">{t('mealPlans.goal')}: </span>
          <Badge variant="outline" data-testid="badge-goal">{t(`mealPlans.goals.${mealPlan.goal}`)}</Badge>
        </div>
      )}

      {/* 7-Day Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('mealPlans.weeklySchedule')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeDay.toString()} onValueChange={(v) => setActiveDay(parseInt(v))}>
            <TabsList className="grid w-full grid-cols-7" data-testid="tabs-days">
              {sortedDays.map((day) => (
                <TabsTrigger
                  key={day.dayNumber}
                  value={day.dayNumber.toString()}
                  data-testid={`tab-day-${day.dayNumber}`}
                >
                  {t('mealPlans.day')} {day.dayNumber}
                </TabsTrigger>
              ))}
            </TabsList>

            {sortedDays.map((day) => (
              <TabsContent
                key={day.dayNumber}
                value={day.dayNumber.toString()}
                className="space-y-4 mt-4"
                data-testid={`content-day-${day.dayNumber}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold" data-testid={`text-day-name-${day.dayNumber}`}>
                    {getDayName(day.dayName)}
                  </h3>
                  {dayTotals[day.dayNumber] && (
                    <div className="text-sm text-muted-foreground" data-testid={`text-day-totals-${day.dayNumber}`}>
                      {t('mealPlans.total')}: {dayTotals[day.dayNumber].calories} {t('mealPlans.cal')} | 
                      {t('mealPlans.proteinShort')}: {dayTotals[day.dayNumber].protein}g | 
                      {t('mealPlans.carbsShort')}: {dayTotals[day.dayNumber].carbs}g | 
                      {t('mealPlans.fatShort')}: {dayTotals[day.dayNumber].fat}g
                    </div>
                  )}
                </div>

                {day.notes && (
                  <p className="text-sm text-muted-foreground italic">{day.notes}</p>
                )}

                {/* Meals */}
                {day.meals.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {t('mealPlans.noMealsScheduled')}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {day.meals.map((meal) => {
                      const mealTotal = meal.items.reduce((sum, item) => {
                        const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
                        const multiplier = quantity / 100;
                        return sum + (parseFloat(item.calories || "0") * multiplier);
                      }, 0);

                      return (
                        <Card key={meal.id} data-testid={`card-meal-${meal.id}`}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  {getMealTypeLabel(meal.mealType)}
                                  {meal.name && ` - ${meal.name}`}
                                </CardTitle>
                                {meal.targetTime && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {t('mealPlans.targetTime')}: {meal.targetTime}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary">{Math.round(mealTotal)} {t('mealPlans.cal')}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {meal.items.length === 0 ? (
                              <p className="text-sm text-muted-foreground">{t('mealPlans.noFoodItems')}</p>
                            ) : (
                              <div className="space-y-2">
                                {meal.items.map((item) => {
                                  const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
                                  const multiplier = quantity / 100;
                                  const calories = Math.round(parseFloat(item.calories || "0") * multiplier);
                                  const protein = Math.round(parseFloat(item.protein || "0") * multiplier);
                                  const carbs = Math.round(parseFloat(item.carbs || "0") * multiplier);
                                  const fat = Math.round(parseFloat(item.fat || "0") * multiplier);

                                  return (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between p-3 border rounded-lg"
                                      data-testid={`item-${item.id}`}
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium">
                                          {item.foodName} ({quantity}g)
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {calories} {t('mealPlans.cal')} | {t('mealPlans.proteinShort')}: {protein}g | {t('mealPlans.carbsShort')}: {carbs}g | {t('mealPlans.fatShort')}: {fat}g
                                        </div>
                                        {item.notes && (
                                          <div className="text-xs text-muted-foreground italic mt-1">
                                            {item.notes}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {meal.notes && (
                              <p className="text-sm text-muted-foreground italic mt-4">
                                {t('mealPlans.note')}: {meal.notes}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {mealPlan.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('mealPlans.planNotes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{mealPlan.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
