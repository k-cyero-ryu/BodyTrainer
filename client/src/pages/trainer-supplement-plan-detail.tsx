import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pill, Clock, Target, Edit } from "lucide-react";
import type { SupplementPlan, SupplementPlanItem, SupplementItem } from "@shared/schema";

interface SupplementPlanItemWithDetails extends SupplementPlanItem {
  supplementItem: SupplementItem;
}

interface CompleteSupplementPlan extends SupplementPlan {
  items: SupplementPlanItemWithDetails[];
}

export default function TrainerSupplementPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: supplementPlan, isLoading, error } = useQuery<CompleteSupplementPlan>({
    queryKey: ["/api/nutrition/supplement-plans", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !supplementPlan) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/trainer-supplements">
          <Button variant="ghost" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('supplements.backToSupplementPlans')}
          </Button>
        </Link>
        <Card className="mt-6">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t('supplements.planNotFound')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-supplement-plan-detail">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/trainer-supplements">
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('supplements.back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-plan-name">{supplementPlan.name}</h1>
            {supplementPlan.description && (
              <p className="text-muted-foreground mt-1">{supplementPlan.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {supplementPlan.isTemplate && (
            <Badge variant="secondary" data-testid="badge-template">{t('supplements.template')}</Badge>
          )}
          <Link href={`/trainer-supplements/${id}/edit`}>
            <Button variant="outline" data-testid="button-edit-full-plan">
              <Edit className="h-4 w-4 mr-2" />
              {t('supplements.editFullPlan')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Card */}
      {supplementPlan.goal && (
        <Card data-testid="card-goal">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('supplements.goal')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold capitalize">{t(`supplements.goals.${supplementPlan.goal}`)}</div>
          </CardContent>
        </Card>
      )}

      {/* Supplements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            {t('supplements.supplementSchedule')} ({supplementPlan.items?.length || 0} {t('supplements.items')})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!supplementPlan.items || supplementPlan.items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('supplements.noSupplementsInPlan')}
            </div>
          ) : (
            <div className="space-y-4">
              {supplementPlan.items
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map((item) => (
                  <Card key={item.id} data-testid={`card-supplement-${item.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {item.supplementItem.name}
                            {item.supplementItem.brand && (
                              <span className="text-sm font-normal text-muted-foreground">
                                ({item.supplementItem.brand})
                              </span>
                            )}
                            {item.isOptional && (
                              <Badge variant="outline" className="ml-2">{t('supplements.optional')}</Badge>
                            )}
                          </CardTitle>
                          {item.supplementItem.purpose && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.supplementItem.purpose}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Dosage and Timing Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(item.dosage || item.supplementItem.defaultDosage) && (
                          <div className="flex items-start gap-2">
                            <Pill className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{t('supplements.dosage')}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.dosage || item.supplementItem.defaultDosage}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {(item.frequency || item.supplementItem.defaultFrequency) && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{t('supplements.frequency')}</div>
                              <div className="text-sm text-muted-foreground">
                                {t(`supplements.frequency.${item.frequency || item.supplementItem.defaultFrequency}`)}
                              </div>
                            </div>
                          </div>
                        )}

                        {(item.timing || item.supplementItem.defaultTiming) && (
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{t('supplements.timing')}</div>
                              <div className="text-sm text-muted-foreground">
                                {t(`supplements.timing.${item.timing || item.supplementItem.defaultTiming}`)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Instructions */}
                      {item.supplementItem.instructions && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">{t('supplements.instructions')}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.supplementItem.instructions}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Notes */}
      {supplementPlan.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('supplements.planNotes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{supplementPlan.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
