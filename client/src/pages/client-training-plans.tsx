import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Dumbbell, 
  Clock, 
  Target, 
  Calendar,
  Eye,
  Play
} from "lucide-react";

export default function ClientTrainingPlans() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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

  const { data: assignedPlans = [], isLoading: plansLoading, error } = useQuery<any[]>({
    queryKey: ["/api/client/assigned-plans"],
    enabled: !!user && user.role === 'client',
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

  // Auto-redirect to active plan if there's exactly one active plan
  useEffect(() => {
    if (!plansLoading && assignedPlans && assignedPlans.length > 0) {
      const activePlans = assignedPlans.filter((plan: any) => plan.isActive);
      if (activePlans.length === 1) {
        // Redirect to the single active plan details
        setLocation(`/my-training-plan/${activePlans[0].planId}`);
        return;
      }
    }
  }, [assignedPlans, plansLoading, setLocation]);

  if (isLoading || plansLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('common.errorLoading')} {t('trainingPlans.myTrainingPlans')}</h2>
          <p className="text-muted-foreground mb-4">
            {isUnauthorizedError(error) ? t('auth.notAuthorizedToView') : t('common.failedToLoad')}
          </p>
          <Link href="/">
            <Button>{t('trainingPlans.returnToDashboard')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('trainingPlans.myTrainingPlans')}</h1>
          <p className="text-muted-foreground">{t('trainingPlans.viewProgress')}</p>
        </div>
      </div>

      {/* Training Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {assignedPlans.length > 0 ? (
          assignedPlans.map((clientPlan: any) => (
            <Card key={clientPlan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{clientPlan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {clientPlan.duration === 0 ? t('trainingPlans.tillGoalMet') : `${clientPlan.duration} ${t('trainingPlans.weeks')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={clientPlan.isActive ? "default" : "secondary"}>
                      {clientPlan.isActive ? t('trainingPlans.active') : t('trainingPlans.inactive')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">{clientPlan.description || t('trainingPlans.noDescription')}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('trainingPlans.goal')}:</span>
                    <div className="font-medium">{clientPlan.goal || t('trainingPlans.notSpecified')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('trainingPlans.duration')}:</span>
                    <div className="font-medium">
                      {clientPlan.duration === 0 ? t('trainingPlans.tillGoalMet') : `${clientPlan.duration} ${t('trainingPlans.weeks')}`}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('trainingPlans.weekCycle')}:</span>
                    <div className="font-medium">{clientPlan.weekCycle || 1} {(clientPlan.weekCycle || 1) > 1 ? t('trainingPlans.weeks') : t('trainingPlans.week')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('trainingPlans.sessionsPerWeek')}:</span>
                    <div className="font-medium">{clientPlan.sessionsPerWeek || t('trainingPlans.na')}</div>
                  </div>
                </div>

                {/* Plan Dates */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('trainingPlans.started')}: {new Date(clientPlan.assignedDate).toLocaleDateString()}
                  </span>
                  {clientPlan.endDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('trainingPlans.ends')}: {new Date(clientPlan.endDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Nutrition Information */}
                {(clientPlan.dailyCalories || clientPlan.protein || clientPlan.carbs) && (
                  <div className="grid grid-cols-3 gap-4 text-xs pt-2 border-t">
                    {clientPlan.dailyCalories && (
                      <div>
                        <span className="text-muted-foreground">{t('trainingPlans.calories')}:</span>
                        <div className="font-medium">{clientPlan.dailyCalories} {t('trainingPlans.kcal')}</div>
                      </div>
                    )}
                    {clientPlan.protein && (
                      <div>
                        <span className="text-muted-foreground">{t('trainingPlans.protein')}:</span>
                        <div className="font-medium">{clientPlan.protein}{t('trainingPlans.grams')}</div>
                      </div>
                    )}
                    {clientPlan.carbs && (
                      <div>
                        <span className="text-muted-foreground">{t('trainingPlans.carbs')}:</span>
                        <div className="font-medium">{clientPlan.carbs}{t('trainingPlans.grams')}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t flex justify-center">
                  <Link href={`/my-training-plan/${clientPlan.planId}`}>
                    <Button size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" />
                      {t('trainingPlans.viewDetails')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('trainingPlans.noPlansYet')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('trainingPlans.noPlansMessage')}
            </p>
            <Link href="/">
              <Button variant="outline">
                <Play className="h-4 w-4 mr-2" />
                {t('trainingPlans.returnToDashboard')}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Help Section */}
      {assignedPlans.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('trainingPlans.needHelp')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{t('trainingPlans.helpText1')}</p>
              <p>{t('trainingPlans.helpText2')}</p>
              <p>{t('trainingPlans.helpText3')}</p>
              <p>{t('trainingPlans.helpText4')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}