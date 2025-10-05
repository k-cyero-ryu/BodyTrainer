import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pill, FileText, ExternalLink, MoreVertical, Edit, Eye, Copy } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SupplementPlan, SupplementItem, SupplementPlanItem } from "@shared/schema";

const supplementPlanFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  goal: z.string().optional(),
  notes: z.string().optional(),
});

type SupplementPlanFormData = z.infer<typeof supplementPlanFormSchema>;

interface SelectedSupplementItem {
  supplementItemId: string;
  frequency: string;
  timing: string;
  isOptional: boolean;
  notes?: string;
}

export default function TrainerSupplements() {
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
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<SupplementPlan | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedSupplementItem[]>([]);
  const [selectedLibraryItemId, setSelectedLibraryItemId] = useState<string>("");

  const form = useForm<SupplementPlanFormData>({
    resolver: zodResolver(supplementPlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      notes: "",
    },
  });

  const { data: supplementItems = [] } = useQuery<SupplementItem[]>({
    queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-items`],
    enabled: !!user?.trainer?.id,
  });

  const { data: supplementPlans = [] } = useQuery<SupplementPlan[]>({
    queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-plans`],
    enabled: !!user?.trainer?.id,
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: { plan: SupplementPlanFormData; items: SelectedSupplementItem[] }) => {
      const planResponseRaw = await apiRequest("POST", "/api/nutrition/supplement-plans", {
        ...data.plan,
        trainerId: user?.trainer?.id,
      });
      const planResponse = await planResponseRaw.json();

      for (const item of data.items) {
        await apiRequest("POST", "/api/nutrition/supplement-plan-items", {
          supplementPlanId: planResponse.id,
          supplementItemId: item.supplementItemId,
          frequency: item.frequency,
          timing: item.timing,
          isOptional: item.isOptional,
          notes: item.notes,
        });
      }

      return planResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-plans`] });
      toast({
        title: t("Success"),
        description: "Supplement plan template created successfully",
      });
      setShowCreateDialog(false);
      form.reset();
      setSelectedItems([]);
      setSelectedLibraryItemId("");
    },
    onError: (error: any) => {
      toast({
        title: t("Error"),
        description: error.message || "Failed to create supplement plan",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("DELETE", `/api/nutrition/supplement-plans/${planId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-plans`] });
      toast({
        title: t("Success"),
        description: "Supplement plan deleted successfully",
      });
      setDeletingPlanId(null);
    },
    onError: (error: any) => {
      toast({
        title: t("Error"),
        description: error.message || "Failed to delete supplement plan",
        variant: "destructive",
      });
      setDeletingPlanId(null);
    },
  });

  const copyPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", `/api/nutrition/supplement-plans/${planId}/copy`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("Success"),
        description: "Supplement plan copied successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-plans`] });
    },
    onError: (error: any) => {
      toast({
        title: t("Error"),
        description: error.message || "Failed to copy supplement plan",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<SupplementPlanFormData> }) => {
      const response = await apiRequest("PATCH", `/api/nutrition/supplement-plans/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("Success"),
        description: "Supplement plan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-plans`] });
      setShowEditDialog(false);
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: t("Error"),
        description: error.message || "Failed to update supplement plan",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: SupplementPlanFormData) => {
    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one supplement item to the plan",
        variant: "destructive",
      });
      return;
    }
    createPlanMutation.mutate({ plan: data, items: selectedItems });
  };

  const handleAddItem = () => {
    if (!selectedLibraryItemId) {
      toast({
        title: "Error",
        description: "Please select a supplement item",
        variant: "destructive",
      });
      return;
    }

    if (selectedItems.some(item => item.supplementItemId === selectedLibraryItemId)) {
      toast({
        title: "Error",
        description: "This supplement is already added to the plan",
        variant: "destructive",
      });
      return;
    }

    setSelectedItems([...selectedItems, {
      supplementItemId: selectedLibraryItemId,
      frequency: "daily",
      timing: "morning",
      isOptional: false,
      notes: "",
    }]);
    setSelectedLibraryItemId("");
  };

  const handleRemoveItem = (supplementItemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.supplementItemId !== supplementItemId));
  };

  const handleUpdateItem = (supplementItemId: string, updates: Partial<SelectedSupplementItem>) => {
    setSelectedItems(selectedItems.map(item =>
      item.supplementItemId === supplementItemId ? { ...item, ...updates } : item
    ));
  };

  const getSupplementItemById = (id: string) => {
    return supplementItems.find(item => item.id === id);
  };

  const handleEditClick = (planId: string) => {
    setLocation(`/trainer-supplements/${planId}/edit`);
  };

  const handleCopyClick = (planId: string) => {
    copyPlanMutation.mutate(planId);
  };

  const handleEditSubmit = (data: SupplementPlanFormData) => {
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, updates: data });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-supplement-plans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Supplement Plan Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create reusable supplement plan templates to assign to your clients
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/trainer-supplement-items">
            <Button variant="outline" data-testid="button-manage-items">
              <FileText className="w-4 h-4 mr-2" />
              Manage Items Library
            </Button>
          </Link>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-plan">
                <Plus className="w-4 h-4 mr-2" />
                Create Plan Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle data-testid="text-dialog-title">Create Supplement Plan Template</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plan Name *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Muscle Building Stack"
                              data-testid="input-name"
                            />
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the purpose of this supplement plan..."
                            rows={2}
                            data-testid="input-description"
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
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Any additional notes..."
                            rows={2}
                            data-testid="input-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Supplement Items</h3>
                      {supplementItems.length === 0 && (
                        <Link href="/trainer-supplement-items">
                          <Button type="button" variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Add Items to Library
                          </Button>
                        </Link>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Select value={selectedLibraryItemId} onValueChange={setSelectedLibraryItemId}>
                        <SelectTrigger className="flex-1" data-testid="select-library-item">
                          <SelectValue placeholder="Select supplement from library" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplementItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} {item.brand && `(${item.brand})`} - {item.defaultDosage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!selectedLibraryItemId}
                        data-testid="button-add-item"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {selectedItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Pill className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No supplements added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedItems.map((item) => {
                          const libraryItem = getSupplementItemById(item.supplementItemId);
                          if (!libraryItem) return null;

                          return (
                            <Card key={item.supplementItemId} data-testid={`card-item-${item.supplementItemId}`}>
                              <CardContent className="pt-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold">{libraryItem.name}</h4>
                                      {libraryItem.brand && (
                                        <p className="text-sm text-muted-foreground">{libraryItem.brand}</p>
                                      )}
                                      <p className="text-sm text-muted-foreground">
                                        Dosage: {libraryItem.defaultDosage}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveItem(item.supplementItemId)}
                                      data-testid={`button-remove-${item.supplementItemId}`}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-sm font-medium">Frequency</label>
                                      <Select
                                        value={item.frequency}
                                        onValueChange={(value) => handleUpdateItem(item.supplementItemId, { frequency: value })}
                                      >
                                        <SelectTrigger data-testid={`select-frequency-${item.supplementItemId}`}>
                                          <SelectValue />
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

                                    <div className="space-y-1">
                                      <label className="text-sm font-medium">Timing</label>
                                      <Select
                                        value={item.timing}
                                        onValueChange={(value) => handleUpdateItem(item.supplementItemId, { timing: value })}
                                      >
                                        <SelectTrigger data-testid={`select-timing-${item.supplementItemId}`}>
                                          <SelectValue />
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

                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={item.isOptional}
                                      onCheckedChange={(checked) =>
                                        handleUpdateItem(item.supplementItemId, { isOptional: !!checked })
                                      }
                                      data-testid={`checkbox-optional-${item.supplementItemId}`}
                                    />
                                    <label className="text-sm">Optional supplement</label>
                                  </div>

                                  <Input
                                    placeholder="Additional notes for this item..."
                                    value={item.notes || ""}
                                    onChange={(e) => handleUpdateItem(item.supplementItemId, { notes: e.target.value })}
                                    data-testid={`input-notes-${item.supplementItemId}`}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        form.reset();
                        setSelectedItems([]);
                        setSelectedLibraryItemId("");
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPlanMutation.isPending}
                      data-testid="button-submit"
                    >
                      {createPlanMutation.isPending ? "Creating..." : "Create Template"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {supplementPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Pill className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No supplement plan templates yet. Create your first one!
              </p>
              {supplementItems.length === 0 && (
                <Link href="/trainer-supplement-items">
                  <Button variant="outline">
                    Add Supplements to Library First
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplementPlans.map((plan) => (
            <Card key={plan.id} data-testid={`card-plan-${plan.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle data-testid={`text-plan-name-${plan.id}`}>{plan.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">Template</Badge>
                    </div>
                    {plan.goal && (
                      <Badge className="mt-2" variant="secondary" data-testid={`badge-goal-${plan.id}`}>
                        {t(`supplements.goals.${plan.goal}`)}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-menu-${plan.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(plan.id)} data-testid={`menu-edit-${plan.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleCopyClick(plan.id)} 
                        disabled={copyPlanMutation.isPending}
                        data-testid={`menu-copy-${plan.id}`}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeletingPlanId(plan.id)} data-testid={`menu-delete-${plan.id}`}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {plan.description && (
                  <CardDescription className="mt-2" data-testid={`text-description-${plan.id}`}>
                    {plan.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.notes && (
                  <p className="text-sm text-muted-foreground" data-testid={`text-notes-${plan.id}`}>
                    {plan.notes}
                  </p>
                )}
                <Link href={`/trainer-supplements/${plan.id}`}>
                  <Button
                    variant="outline"
                    className="w-full"
                    data-testid={`button-view-plan-${plan.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingPlanId} onOpenChange={() => setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplement Plan Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this supplement plan template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlanId && deletePlanMutation.mutate(deletingPlanId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplement Plan</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Plan name"
                        defaultValue={editingPlan?.name}
                        data-testid="input-edit-name"
                      />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief description"
                        defaultValue={editingPlan?.description || ""}
                        data-testid="input-edit-description"
                      />
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
                    <Select onValueChange={field.onChange} defaultValue={editingPlan?.goal || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-goal">
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional notes"
                        defaultValue={editingPlan?.notes || ""}
                        data-testid="input-edit-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingPlan(null);
                  }}
                  data-testid="button-edit-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePlanMutation.isPending} data-testid="button-edit-submit">
                  {updatePlanMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
