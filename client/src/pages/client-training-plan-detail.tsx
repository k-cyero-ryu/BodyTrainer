import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRoute, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  ArrowLeft, 
  Activity, 
  Clock, 
  Target, 
  Play,
  Calendar,
  User,
  Dumbbell
} from "lucide-react";

export default function ClientTrainingPlanDetail() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [match, params] = useRoute("/my-training-plan/:planId");
  const planId = params?.planId;
  const { t } = useTranslation();

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

  const { data: plan, isLoading: planLoading, error: planError } = useQuery({
    queryKey: [`/api/training-plans/${planId}`],
    enabled: !!planId && !!user && user.role === 'client',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('auth.unauthorized'),
          description: t('auth.loggedOutRetry'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ["/api/exercises"],
    enabled: !!user && user.role === 'client',
  });

  const linkify = (text: string) => {
    if (!text) return "";
    const urlPattern = /(\b(https?:\/\/|www\.)[^\s]+)/gi;
    return text.replace(urlPattern, (url) => {
      const href = url.startsWith("http") ? url : `https://${url}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${url}</a>`;
    });
  };

  if (isLoading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('common.accessDenied')}</h2>
          <p className="text-muted-foreground">{t('common.accessDeniedMessage')}</p>
        </div>
      </div>
    );
  }

  if (planError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('common.errorLoading')} {t('trainingPlans.myTrainingPlans')}</h2>
          <p className="text-muted-foreground mb-4">
            {isUnauthorizedError(planError) ? t('auth.notAuthorizedToView') : t('common.failedToLoad')}
          </p>
          <Link href="/">
            <Button>{t('trainingPlanDetail.backToDashboard')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('common.notFound')}</h2>
          <p className="text-muted-foreground mb-4">{t('common.notFoundMessage')}</p>
          <Link href="/">
            <Button>{t('trainingPlanDetail.backToDashboard')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getExerciseDetails = (exerciseId: string) => {
    return exercises.find((ex: any) => ex.id === exerciseId);
  };

  const getDayName = (dayNumber: number) => {
    const days = [
      t('trainingPlanDetail.sunday'), 
      t('trainingPlanDetail.monday'), 
      t('trainingPlanDetail.tuesday'), 
      t('trainingPlanDetail.wednesday'), 
      t('trainingPlanDetail.thursday'), 
      t('trainingPlanDetail.friday'), 
      t('trainingPlanDetail.saturday')
    ];
    return days[dayNumber] || `${t('trainingPlanDetail.day')} ${dayNumber}`;
  };

  // Group exercises by day
  const exercisesByDay = plan.planExercises?.reduce((acc: any, exercise: any) => {
    const day = exercise.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(exercise);
    return acc;
  }, {}) || {};

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('trainingPlanDetail.backToDashboard')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{plan.name}</h1>
            <p className="text-muted-foreground">{plan.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={plan.isActive ? "default" : "secondary"}>
            {plan.isActive ? t('trainingPlans.active') : t('trainingPlans.draft')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Plan Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('trainingPlanDetail.planOverview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('trainingPlans.duration')}</p>
                  <p className="text-sm text-muted-foreground">
                    {plan.duration === 0 ? t('trainingPlans.tillGoalMet') : `${plan.duration} ${t('trainingPlans.weeks')}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('trainingPlans.weekCycle')}</p>
                  <p className="text-sm text-muted-foreground">
                    {plan.weekCycle || 1} {(plan.weekCycle || 1) > 1 ? t('trainingPlans.weeks') : t('trainingPlans.week')} {t('trainingPlans.weekPattern')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('trainingPlans.goal')}</p>
                  <p className="text-sm text-muted-foreground">{plan.goal || t('trainingPlans.notSpecified')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Play className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('trainingPlanDetail.totalExercises')}</p>
                  <p className="text-sm text-muted-foreground">{plan.planExercises?.length || 0} {t('trainingPlanDetail.exercises')}</p>
                </div>
              </div>
              
              {/* Nutrition Information */}
              {(plan.dailyCalories || plan.protein || plan.carbs) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium">{t('trainingPlanDetail.nutritionGuidelines')}</h4>
                    {plan.dailyCalories && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('trainingPlanDetail.dailyCalories')}:</span>
                        <span className="font-medium">{plan.dailyCalories} {t('trainingPlans.kcal')}</span>
                      </div>
                    )}
                    {plan.protein && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('trainingPlans.protein')}:</span>
                        <span className="font-medium">{plan.protein}{t('trainingPlans.grams')}</span>
                      </div>
                    )}
                    {plan.carbs && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('trainingPlans.carbs')}:</span>
                        <span className="font-medium">{plan.carbs}{t('trainingPlans.grams')}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Schedule */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                {t('trainingPlanDetail.weeklySchedule')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(exercisesByDay).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(exercisesByDay)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([dayNumber, dayExercises]: [string, any]) => (
                    <div key={dayNumber} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                          {parseInt(dayNumber) + 1}
                        </div>
                        <h3 className="text-lg font-semibold">{getDayName(parseInt(dayNumber))}</h3>
                        <Badge variant="outline">{(dayExercises as any[]).length} {t('trainingPlanDetail.exercises')}</Badge>
                      </div>
                      
                      <div className="grid gap-3">
                        {(dayExercises as any[]).map((planExercise: any, index: number) => {
                          const exercise = getExerciseDetails(planExercise.exerciseId);

                          return (
                            <div key={planExercise.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">
                                    {exercise?.name || `${t('trainingPlanDetail.exercise')} ${index + 1}`}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {exercise?.category || t('trainingPlanDetail.general')}
                                  </p>
                                </div>
                              </div>
                              
                              {exercise?.description && (
                                <p
                                  className="text-sm text-muted-foreground mb-3"
                                  dangerouslySetInnerHTML={{ __html: linkify(exercise.description) }}
                                />
                              )}

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {planExercise.sets && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">{t('trainingPlanDetail.sets')}:</span>
                                    <div className="font-medium">{planExercise.sets}</div>
                                  </div>
                                )}
                                {planExercise.reps && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">{t('trainingPlanDetail.reps')}:</span>
                                    <div className="font-medium">{planExercise.reps}</div>
                                  </div>
                                )}
                                {planExercise.duration && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">{t('trainingPlanDetail.duration')}:</span>
                                    <div className="font-medium">{planExercise.duration} {t('trainingPlanDetail.min')}</div>
                                  </div>
                                )}
                                {planExercise.restTime && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">{t('trainingPlanDetail.rest')}:</span>
                                    <div className="font-medium">{planExercise.restTime} {t('trainingPlanDetail.sec')}</div>
                                  </div>
                                )}
                              </div>

                              {planExercise.weight && (
                                <div className="mt-2 text-sm">
                                  <span className="font-medium text-muted-foreground">{t('trainingPlanDetail.weight')}: </span>
                                  <span className="font-medium">{planExercise.weight} {t('trainingPlanDetail.kg')}</span>
                                </div>
                              )}

                              {planExercise.notes && (
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">{t('trainingPlanDetail.notes')}: </span>
                                    {planExercise.notes}
                                  </p>
                                </div>
                              )}

                              {(exercise?.mediaUrl || exercise?.mediaURL) && (
                                <div className="mt-3 pt-3 border-t">
                                  <h5 className="text-sm font-medium mb-2">{t('trainingPlanDetail.exerciseMedia')}:</h5>
                                  {exercise.mediaType === 'video' ? (
                                    <video 
                                      src={exercise.mediaUrl || exercise.mediaURL} 
                                      controls
                                      className="w-full max-w-sm h-48 rounded-lg"
                                      poster=""
                                    >
                                      {t('trainingPlanDetail.videoNotSupported')}
                                    </video>
                                  ) : (
                                    <img 
                                      src={exercise.mediaUrl || exercise.mediaURL} 
                                      alt={exercise.name} 
                                      className="w-full max-w-sm h-48 object-cover rounded-lg"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('trainingPlanDetail.noExercises')}</h3>
                  <p className="text-muted-foreground">
                    {t('trainingPlanDetail.noExercisesMessage')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}