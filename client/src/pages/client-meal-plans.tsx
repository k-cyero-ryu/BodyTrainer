import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Target, UtensilsCrossed } from "lucide-react";
import type { MealPlan, MealPlanAssignment, MealDay, Meal, MealItem } from "@shared/schema";

interface MealPlanWithDetails extends MealPlan {
  mealDays?: (MealDay & {
    meals?: (Meal & {
      items?: MealItem[];
    })[];
  })[];
}

interface AssignmentWithPlan extends MealPlanAssignment {
  mealPlan?: MealPlanWithDetails;
}

export default function ClientMealPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const DAY_NAMES = [
    t('days.monday'),
    t('days.tuesday'),
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday'),
    t('days.saturday'),
    t('days.sunday')
  ];

  const getMealTypeLabel = (mealType: string) => {
    const typeKey = mealType.replace('-', '_');
    return t(`mealPlans.mealTypes.${typeKey}`);
  };

  const { data: activeAssignment, isLoading } = useQuery<AssignmentWithPlan>({
    queryKey: [`/api/nutrition/clients/${user?.client?.id}/meal-plan-assignments/active`],
    enabled: !!user?.client?.id,
  });

  const activeMealPlan = activeAssignment?.mealPlan;

  const { data: mealDays = [] } = useQuery<(MealDay & {
    meals?: (Meal & { items?: MealItem[] })[];
  })[]>({
    queryKey: [`/api/nutrition/meal-plans/${activeMealPlan?.id}/days`],
    enabled: !!activeMealPlan?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!activeMealPlan) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t('mealPlans.myMealPlan')}</h1>
            <p className="text-muted-foreground">{t('mealPlans.viewActivePlan')}</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('mealPlans.noActivePlan')}</h3>
            <p className="text-muted-foreground text-center">
              {t('mealPlans.noActivePlanDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedDays = [...mealDays].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('mealPlans.myMealPlan')}</h1>
          <p className="text-muted-foreground">{t('mealPlans.followNutritionPlan')}</p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          {t('mealPlans.activePlan')}
        </Badge>
      </div>

      <Card className="mb-6" data-testid="card-meal-plan-overview">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{activeMealPlan.name}</CardTitle>
              {activeMealPlan.description && (
                <CardDescription className="mt-2 text-base">
                  {activeMealPlan.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                <span className="text-sm">{t('mealPlans.dailyTarget')}</span>
              </div>
              <div>
                <div className="text-3xl font-bold" data-testid="text-daily-calories">
                  {activeMealPlan.dailyCalories}
                </div>
                <div className="text-sm text-muted-foreground">{t('mealPlans.calories')}</div>
              </div>
            </div>

            {activeMealPlan.targetProtein && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t('mealPlans.protein')}</div>
                <div>
                  <div className="text-2xl font-semibold" data-testid="text-target-protein">
                    {activeMealPlan.targetProtein}g
                  </div>
                </div>
              </div>
            )}

            {activeMealPlan.targetCarbs && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t('mealPlans.carbs')}</div>
                <div>
                  <div className="text-2xl font-semibold" data-testid="text-target-carbs">
                    {activeMealPlan.targetCarbs}g
                  </div>
                </div>
              </div>
            )}

            {activeMealPlan.targetFat && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{t('mealPlans.fat')}</div>
                <div>
                  <div className="text-2xl font-semibold" data-testid="text-target-fat">
                    {activeMealPlan.targetFat}g
                  </div>
                </div>
              </div>
            )}
          </div>

          {(activeAssignment?.startDate || activeMealPlan.goal) && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMealPlan.goal && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('mealPlans.goal')}:</span>
                    <Badge variant="outline">{t(`mealPlans.goals.${activeMealPlan.goal}`)}</Badge>
                  </div>
                )}
                {activeAssignment?.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('mealPlans.started')}:</span>
                    <span className="text-sm font-medium">
                      {new Date(activeAssignment.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {activeMealPlan.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <div className="text-sm font-medium mb-2">{t('mealPlans.trainerNotes')}:</div>
                <p className="text-sm text-muted-foreground">{activeMealPlan.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-weekly-meals">
        <CardHeader>
          <CardTitle>{t('mealPlans.weeklyMealSchedule')}</CardTitle>
          <CardDescription>{t('mealPlans.dailyMealBreakdown')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="1" className="w-full">
            <TabsList className="grid grid-cols-7 w-full">
              {DAY_NAMES.map((day, index) => (
                <TabsTrigger key={index + 1} value={(index + 1).toString()} data-testid={`tab-day-${index + 1}`}>
                  {day.slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>
            {sortedDays.map((day) => (
              <TabsContent key={day.dayNumber} value={day.dayNumber.toString()} className="space-y-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">{day.dayName || DAY_NAMES[day.dayNumber - 1]}</h3>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{t('mealPlans.dayTotal')}</div>
                    <div className="text-lg font-semibold" data-testid={`text-day-total-${day.dayNumber}`}>
                      {day.totalCalories || 0} {t('mealPlans.calories')}
                    </div>
                    {(day.totalProtein || day.totalCarbs || day.totalFat) && (
                      <div className="text-xs text-muted-foreground">
                        P: {parseFloat(day.totalProtein?.toString() || "0").toFixed(0)}g |{" "}
                        C: {parseFloat(day.totalCarbs?.toString() || "0").toFixed(0)}g |{" "}
                        F: {parseFloat(day.totalFat?.toString() || "0").toFixed(0)}g
                      </div>
                    )}
                  </div>
                </div>

                {day.meals && day.meals.length > 0 ? (
                  <div className="space-y-4">
                    {day.meals.map((meal) => (
                      <Card key={meal.id} data-testid={`card-meal-${meal.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {meal.name || getMealTypeLabel(meal.mealType)}
                              </CardTitle>
                              {meal.targetTime && (
                                <CardDescription className="mt-1">
                                  {meal.targetTime}
                                </CardDescription>
                              )}
                            </div>
                            <Badge variant="secondary">{getMealTypeLabel(meal.mealType)}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {meal.items && meal.items.length > 0 ? (
                            <div className="space-y-3">
                              {meal.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-start justify-between p-3 bg-muted rounded-lg"
                                  data-testid={`row-meal-item-${item.id}`}
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">{item.foodName}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {parseFloat(item.quantity?.toString() || "0").toFixed(0)}{item.unit || "g"}
                                      {item.notes && ` • ${item.notes}`}
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    {item.calories && (
                                      <div className="font-semibold">
                                        {parseFloat(item.calories.toString()).toFixed(0)} cal
                                      </div>
                                    )}
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {item.protein && `P: ${parseFloat(item.protein.toString()).toFixed(0)}g`}
                                      {item.carbs && ` C: ${parseFloat(item.carbs.toString()).toFixed(0)}g`}
                                      {item.fat && ` F: ${parseFloat(item.fat.toString()).toFixed(0)}g`}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No food items specified for this meal
                            </p>
                          )}
                          {meal.notes && (
                            <>
                              <Separator className="my-3" />
                              <div className="text-sm">
                                <span className="font-medium">Notes: </span>
                                <span className="text-muted-foreground">{meal.notes}</span>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <UtensilsCrossed className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No meals planned for this day</p>
                    </CardContent>
                  </Card>
                )}

                {day.notes && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm">
                        <span className="font-medium">Day Notes: </span>
                        <span className="text-muted-foreground">{day.notes}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
