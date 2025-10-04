import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Info, Pill } from "lucide-react";
import type { SupplementPlan, SupplementItem } from "@shared/schema";

interface SupplementPlanWithItems extends SupplementPlan {
  supplementItems?: SupplementItem[];
}

export default function ClientSupplements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: activeSupplementPlan, isLoading } = useQuery<SupplementPlanWithItems>({
    queryKey: [`/api/nutrition/clients/${user?.client?.id}/supplement-plan-assignments/active`],
    enabled: !!user?.client?.id,
  });

  const { data: supplementItems = [] } = useQuery<SupplementItem[]>({
    queryKey: ["/api/nutrition/supplement-plans", activeSupplementPlan?.id, "items"],
    enabled: !!activeSupplementPlan?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!activeSupplementPlan) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Supplements</h1>
            <p className="text-muted-foreground">View your active supplement plan</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active supplement plan</h3>
            <p className="text-muted-foreground text-center">
              Your trainer hasn't assigned a supplement plan yet. Contact your trainer if you need guidance.
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
          <h1 className="text-3xl font-bold">My Supplements</h1>
          <p className="text-muted-foreground">Follow your personalized supplement protocol</p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          Active Plan
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
                <span className="text-sm text-muted-foreground">Goal:</span>
                <Badge variant="outline">{activeSupplementPlan.goal.replace("_", " ")}</Badge>
              </div>
            )}
            {activeSupplementPlan.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Started:</span>
                <span className="text-sm font-medium">
                  {new Date(activeSupplementPlan.startDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {activeSupplementPlan.endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Ends:</span>
                <span className="text-sm font-medium">
                  {new Date(activeSupplementPlan.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {activeSupplementPlan.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <div className="text-sm font-medium mb-2">Trainer Notes:</div>
                <p className="text-sm text-muted-foreground">{activeSupplementPlan.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {requiredSupplements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Required Supplements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredSupplements.map((supplement) => (
              <Card key={supplement.id} data-testid={`card-supplement-${supplement.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{supplement.name}</CardTitle>
                      {supplement.brand && (
                        <CardDescription className="mt-1">
                          Brand: {supplement.brand}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="default">Required</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Dosage</div>
                      <div className="text-lg font-semibold" data-testid={`text-dosage-${supplement.id}`}>
                        {supplement.dosage}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Frequency</div>
                      <div className="text-lg font-semibold" data-testid={`text-frequency-${supplement.id}`}>
                        {supplement.frequency}
                      </div>
                    </div>
                  </div>

                  {supplement.timing && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span>Timing</span>
                      </div>
                      <div className="text-base" data-testid={`text-timing-${supplement.id}`}>
                        {supplement.timing}
                      </div>
                    </div>
                  )}

                  {supplement.purpose && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Purpose</div>
                        <p className="text-sm">{supplement.purpose}</p>
                      </div>
                    </>
                  )}

                  {supplement.instructions && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Instructions</div>
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
          <h2 className="text-2xl font-semibold mb-4">Optional Supplements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalSupplements.map((supplement) => (
              <Card key={supplement.id} data-testid={`card-supplement-optional-${supplement.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{supplement.name}</CardTitle>
                      {supplement.brand && (
                        <CardDescription className="mt-1">
                          Brand: {supplement.brand}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary">Optional</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Dosage</div>
                      <div className="text-lg font-semibold" data-testid={`text-dosage-${supplement.id}`}>
                        {supplement.dosage}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Frequency</div>
                      <div className="text-lg font-semibold" data-testid={`text-frequency-${supplement.id}`}>
                        {supplement.frequency}
                      </div>
                    </div>
                  </div>

                  {supplement.timing && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span>Timing</span>
                      </div>
                      <div className="text-base" data-testid={`text-timing-${supplement.id}`}>
                        {supplement.timing}
                      </div>
                    </div>
                  )}

                  {supplement.purpose && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Purpose</div>
                        <p className="text-sm">{supplement.purpose}</p>
                      </div>
                    </>
                  )}

                  {supplement.instructions && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Instructions</div>
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
