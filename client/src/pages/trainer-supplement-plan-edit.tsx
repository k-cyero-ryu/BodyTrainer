import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, Plus, Trash2, Pill } from "lucide-react";
import type { SupplementPlan, SupplementPlanItem, SupplementItem } from "@shared/schema";

interface SupplementPlanItemWithDetails extends SupplementPlanItem {
  supplementItem: SupplementItem;
}

interface CompleteSupplementPlan extends SupplementPlan {
  items: SupplementPlanItemWithDetails[];
}

const supplementPlanFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  goal: z.string().optional(),
  notes: z.string().optional(),
});

type SupplementPlanFormData = z.infer<typeof supplementPlanFormSchema>;

export default function TrainerSupplementPlanEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const FREQUENCY_OPTIONS = [
    { value: "daily", label: t('supplements.frequency.daily') },
    { value: "2x_daily", label: t('supplements.frequency.2x_daily') },
    { value: "3x_daily", label: t('supplements.frequency.3x_daily') },
    { value: "post_workout", label: t('supplements.frequency.post_workout') },
    { value: "pre_workout", label: t('supplements.frequency.pre_workout') },
    { value: "as_needed", label: t('supplements.frequency.as_needed') },
  ];

  const TIMING_OPTIONS = [
    { value: "morning", label: t('supplements.timing.morning') },
    { value: "afternoon", label: t('supplements.timing.afternoon') },
    { value: "evening", label: t('supplements.timing.evening') },
    { value: "before_bed", label: t('supplements.timing.before_bed') },
    { value: "with_meals", label: t('supplements.timing.with_meals') },
    { value: "between_meals", label: t('supplements.timing.between_meals') },
    { value: "post_workout", label: t('supplements.timing.post_workout') },
    { value: "pre_workout", label: t('supplements.timing.pre_workout') },
  ];

  const GOAL_OPTIONS = [
    { value: "recovery", label: t('supplements.goals.recovery') },
    { value: "energy", label: t('supplements.goals.energy') },
    { value: "muscle_gain", label: t('supplements.goals.muscle_gain') },
    { value: "health", label: t('supplements.goals.health') },
    { value: "performance", label: t('supplements.goals.performance') },
    { value: "weight_loss", label: t('supplements.goals.weight_loss') },
  ];
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [planItems, setPlanItems] = useState<SupplementPlanItemWithDetails[]>([]);
  const [modifiedItems, setModifiedItems] = useState<Set<string>>(new Set());

  const { data: supplementPlan, isLoading, error } = useQuery<CompleteSupplementPlan>({
    queryKey: ["/api/nutrition/supplement-plans", id],
    enabled: !!id,
  });

  const { data: availableSupplements = [] } = useQuery<SupplementItem[]>({
    queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-items`],
    enabled: !!user?.trainer?.id,
  });

  const form = useForm<SupplementPlanFormData>({
    resolver: zodResolver(supplementPlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (supplementPlan) {
      form.reset({
        name: supplementPlan.name,
        description: supplementPlan.description || "",
        goal: supplementPlan.goal || "",
        notes: supplementPlan.notes || "",
      });
      setPlanItems(supplementPlan.items || []);
      setModifiedItems(new Set()); // Clear modifications when loading fresh data
    }
  }, [supplementPlan, form]);

  const updatePlanMutation = useMutation({
    mutationFn: async (data: SupplementPlanFormData) => {
      return await apiRequest("PATCH", `/api/nutrition/supplement-plans/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/supplement-plans", id] });
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-plans`] });
      toast({
        title: t('common.success'),
        description: t('supplements.planUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('supplements.failedToUpdatePlan'),
        variant: "destructive",
      });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: { supplementItemId: string; dosage?: string; frequency?: string; timing?: string; isOptional?: boolean; sortOrder?: number }) => {
      return await apiRequest("POST", "/api/nutrition/supplement-plan-items", {
        supplementPlanId: id,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/supplement-plans", id] });
      toast({
        title: t('common.success'),
        description: t('supplements.supplementAddedToPlan'),
      });
      setShowAddItemDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('supplements.failedToAddSupplementToPlan'),
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: { itemId: string; updates: Partial<SupplementPlanItem> }) => {
      return await apiRequest("PATCH", `/api/nutrition/supplement-plan-items/${data.itemId}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/supplement-plans", id] });
      toast({
        title: t('common.success'),
        description: t('supplements.supplementUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('supplements.failedToUpdateSupplement'),
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest("DELETE", `/api/nutrition/supplement-plan-items/${itemId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/supplement-plans", id] });
      toast({
        title: t('common.success'),
        description: t('supplements.supplementRemovedFromPlan'),
      });
      setRemovingItemId(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('supplements.failedToRemoveSupplement'),
        variant: "destructive",
      });
    },
  });

  const handleSavePlan = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      const planData = form.getValues();
      
      try {
        // Save plan metadata
        await apiRequest("PATCH", `/api/nutrition/supplement-plans/${id}`, planData);
        
        // Save all modified items
        const savePromises = Array.from(modifiedItems).map(itemId => {
          const item = planItems.find(i => i.id === itemId);
          if (item) {
            return apiRequest("PATCH", `/api/nutrition/supplement-plan-items/${itemId}`, {
              dosage: item.dosage,
              frequency: item.frequency,
              timing: item.timing,
              isOptional: item.isOptional,
            });
          }
          return Promise.resolve();
        });
        
        await Promise.all(savePromises);
        
        // Invalidate queries and show success
        queryClient.invalidateQueries({ queryKey: ["/api/nutrition/supplement-plans", id] });
        queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${(user as any)?.trainer?.id}/supplement-plans`] });
        setModifiedItems(new Set());
        
        toast({
          title: t('common.success'),
          description: t('supplements.planUpdatedSuccess', { count: modifiedItems.size }),
        });
      } catch (error: any) {
        toast({
          title: t('common.error'),
          description: error.message || t('supplements.failedToUpdatePlan'),
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateItem = (itemId: string, field: keyof SupplementPlanItem, value: any) => {
    // Update local state only
    setPlanItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
    // Track as modified
    setModifiedItems(prev => new Set(prev).add(itemId));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
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
    <div className="container mx-auto p-6 space-y-6" data-testid="page-supplement-plan-edit">
      {/* Header with Actions */}
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-4">
        <div className="flex items-center gap-4">
          <Link href={`/trainer-supplements/${id}`}>
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('supplements.back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t('supplements.editSupplementPlan')}</h1>
            <p className="text-muted-foreground">{t('supplements.makeChangesToPlan')}</p>
          </div>
        </div>
        <Button 
          onClick={handleSavePlan}
          disabled={updatePlanMutation.isPending}
          data-testid="button-save-plan"
        >
          <Save className="h-4 w-4 mr-2" />
          {t('supplements.savePlan')}
        </Button>
      </div>

      {/* Plan Metadata Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('supplements.planDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('supplements.planName')} *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('supplements.planNamePlaceholder')} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('supplements.description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t('supplements.descriptionPlaceholder')} data-testid="input-description" />
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
                    <FormLabel>{t('supplements.goal')}</FormLabel>
                    <FormControl>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-goal">
                          <SelectValue placeholder={t('supplements.selectGoal')} />
                        </SelectTrigger>
                        <SelectContent>
                          {GOAL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <FormLabel>{t('supplements.notes')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t('supplements.notesPlaceholder')} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Supplement Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                {t('supplements.supplementsInPlan')} ({planItems.length})
              </CardTitle>
            </div>
            <Button 
              onClick={() => setShowAddItemDialog(true)}
              size="sm"
              data-testid="button-add-supplement"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('supplements.addSupplement')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {planItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('supplements.noSupplementsAddedYet')}
            </div>
          ) : (
            <div className="space-y-4">
              {planItems
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map((item, index) => (
                  <Card key={item.id} data-testid={`item-${item.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{item.supplementItem.name}</h4>
                            {item.supplementItem.brand && (
                              <span className="text-sm text-muted-foreground">({item.supplementItem.brand})</span>
                            )}
                          </div>
                          {item.supplementItem.purpose && (
                            <p className="text-sm text-muted-foreground mt-1">{item.supplementItem.purpose}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRemovingItemId(item.id)}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">{t('supplements.dosage')}</label>
                          <Input
                            value={item.dosage || item.supplementItem.defaultDosage || ""}
                            onChange={(e) => handleUpdateItem(item.id, "dosage", e.target.value)}
                            placeholder={item.supplementItem.defaultDosage || t('supplements.dosagePlaceholder')}
                            data-testid={`input-dosage-${item.id}`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t('supplements.frequency')}</label>
                          <Select
                            value={item.frequency || item.supplementItem.defaultFrequency || ""}
                            onValueChange={(value) => handleUpdateItem(item.id, "frequency", value)}
                          >
                            <SelectTrigger data-testid={`select-frequency-${item.id}`}>
                              <SelectValue placeholder={t('supplements.selectFrequency')} />
                            </SelectTrigger>
                            <SelectContent>
                              {FREQUENCY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">{t('supplements.timing')}</label>
                          <Select
                            value={item.timing || item.supplementItem.defaultTiming || ""}
                            onValueChange={(value) => handleUpdateItem(item.id, "timing", value)}
                          >
                            <SelectTrigger data-testid={`select-timing-${item.id}`}>
                              <SelectValue placeholder={t('supplements.selectTiming')} />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMING_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={item.isOptional || false}
                          onCheckedChange={(checked) => handleUpdateItem(item.id, "isOptional", checked)}
                          data-testid={`checkbox-optional-${item.id}`}
                        />
                        <label className="text-sm">{t('supplements.optionalSupplement')}</label>
                      </div>
                      {item.supplementItem.instructions && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">{t('supplements.instructions')}</p>
                          <p className="text-sm text-muted-foreground">{item.supplementItem.instructions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Supplement Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('supplements.addSupplementToPlan')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {availableSupplements.filter(
              sup => !planItems.some(item => item.supplementItemId === sup.id)
            ).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('supplements.allSupplementsInPlan')}
              </p>
            ) : (
              <div className="space-y-2">
                {availableSupplements
                  .filter(sup => !planItems.some(item => item.supplementItemId === sup.id))
                  .map((supplement) => (
                    <Card 
                      key={supplement.id} 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        addItemMutation.mutate({
                          supplementItemId: supplement.id,
                          sortOrder: planItems.length,
                        });
                      }}
                      data-testid={`add-supplement-${supplement.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{supplement.name}</h4>
                            {supplement.brand && (
                              <p className="text-sm text-muted-foreground">{supplement.brand}</p>
                            )}
                          </div>
                          <Badge variant="outline">{supplement.defaultDosage}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removingItemId} onOpenChange={() => setRemovingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Supplement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the supplement from this plan. The supplement item itself will remain available for other plans.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingItemId && removeItemMutation.mutate(removingItemId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
