import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Info, Pill } from "lucide-react";
import type { SupplementPlan, SupplementItem, SupplementPlanAssignment } from "@shared/schema";

interface SupplementPlanWithItems extends SupplementPlan {
  supplementItems?: SupplementItem[];
}

interface AssignmentWithPlan extends SupplementPlanAssignment {
  supplementPlan?: SupplementPlanWithItems;
}

export default function ClientSupplements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: activeAssignment, isLoading } = useQuery<AssignmentWithPlan>({
    queryKey: [`/api/nutrition/clients/${user?.client?.id}/supplement-plan-assignments/active`],
    enabled: !!user?.client?.id,
  });

  const activeSupplementPlan = activeAssignment?.supplementPlan;

  const { data: supplementItems = [] } = useQuery<SupplementItem[]>({
    queryKey: [`/api/nutrition/supplement-plans/${activeSupplementPlan?.id}/items`],
    enabled: !!activeSupplementPlan?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getFrequencyLabel = (frequency: string) => {
    const freqKey = frequency.replace(' ', '_').replace('-', '_');
    return t(`supplements.frequency.${freqKey}`);
  };

  const getTimingLabel = (timing: string) => {
    const timingKey = timing.replace(' ', '_').replace('-', '_');
    return t(`supplements.timing.${timingKey}`);
  };

  if (!activeSupplementPlan) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t('supplements.mySupplements')}</h1>
            <p className="text-muted-foreground">{t('supplements.viewActivePlan')}</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('supplements.noActivePlan')}</h3>
            <p className="text-muted-foreground text-center">
              {t('supplements.noActivePlanDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requiredSupplements = supplementItems.filter((item) => !item.isOptional);
  const optionalSupplements = supplementItems.filter((item) => item.isOptional);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('supplements.mySupplements')}</h1>
          <p className="text-muted-foreground">{t('supplements.followProtocol')}</p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          {t('supplements.activePlan')}
        </Badge>
      </div>

      <Card className="mb-6" data-testid="card-supplement-plan-overview">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{activeSupplementPlan.name}</CardTitle>
              {activeSupplementPlan.description && (
                <CardDescription className="mt-2 text-base">
                  {activeSupplementPlan.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeSupplementPlan.goal && (
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('supplements.goal')}:</span>
                <Badge variant="outline">{t(`supplements.goals.${activeSupplementPlan.goal}`)}</Badge>
              </div>
            )}
            {activeAssignment?.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('supplements.started')}:</span>
                <span className="text-sm font-medium">
                  {new Date(activeAssignment.startDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {activeAssignment?.endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('supplements.ends')}:</span>
                <span className="text-sm font-medium">
                  {new Date(activeAssignment.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {activeSupplementPlan.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <div className="text-sm font-medium mb-2">{t('supplements.trainerNotes')}:</div>
                <p className="text-sm text-muted-foreground">{activeSupplementPlan.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {requiredSupplements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">{t('supplements.requiredSupplements')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredSupplements.map((supplement) => (
              <Card key={supplement.id} data-testid={`card-supplement-${supplement.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{supplement.name}</CardTitle>
                      {supplement.brand && (
                        <CardDescription className="mt-1">
                          {t('supplements.brand')}: {supplement.brand}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="default">{t('supplements.required')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">{t('supplements.dosage')}</div>
                      <div className="text-lg font-semibold" data-testid={`text-dosage-${supplement.id}`}>
                        {supplement.dosage}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">{t('supplements.frequency')}</div>
                      <div className="text-lg font-semibold" data-testid={`text-frequency-${supplement.id}`}>
                        {getFrequencyLabel(supplement.frequency)}
                      </div>
                    </div>
                  </div>

                  {supplement.timing && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span>{t('supplements.timing')}</span>
                      </div>
                      <div className="text-base" data-testid={`text-timing-${supplement.id}`}>
                        {getTimingLabel(supplement.timing)}
                      </div>
                    </div>
                  )}

                  {supplement.purpose && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">{t('supplements.purpose')}</div>
                        <p className="text-sm">{supplement.purpose}</p>
                      </div>
                    </>
                  )}

                  {supplement.instructions && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">{t('supplements.instructions')}</div>
                        <p className="text-sm text-muted-foreground">{supplement.instructions}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {optionalSupplements.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t('supplements.optionalSupplements')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalSupplements.map((supplement) => (
              <Card key={supplement.id} data-testid={`card-supplement-optional-${supplement.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{supplement.name}</CardTitle>
                      {supplement.brand && (
                        <CardDescription className="mt-1">
                          {t('supplements.brand')}: {supplement.brand}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary">{t('supplements.optional')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">{t('supplements.dosage')}</div>
                      <div className="text-lg font-semibold" data-testid={`text-dosage-${supplement.id}`}>
                        {supplement.dosage}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">{t('supplements.frequency')}</div>
                      <div className="text-lg font-semibold" data-testid={`text-frequency-${supplement.id}`}>
                        {getFrequencyLabel(supplement.frequency)}
                      </div>
                    </div>
                  </div>

                  {supplement.timing && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span>{t('supplements.timing')}</span>
                      </div>
                      <div className="text-base" data-testid={`text-timing-${supplement.id}`}>
                        {getTimingLabel(supplement.timing)}
                      </div>
                    </div>
                  )}

                  {supplement.purpose && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">{t('supplements.purpose')}</div>
                        <p className="text-sm">{supplement.purpose}</p>
                      </div>
                    </>
                  )}

                  {supplement.instructions && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">{t('supplements.instructions')}</div>
                        <p className="text-sm text-muted-foreground">{supplement.instructions}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {supplementItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No supplements have been added to this plan yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
