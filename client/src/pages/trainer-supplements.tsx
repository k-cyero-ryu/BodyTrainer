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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, Pill } from "lucide-react";
import type { SupplementPlan, SupplementItem, Client, InsertSupplementPlan } from "@shared/schema";

const supplementPlanFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  goal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

type SupplementPlanFormData = z.infer<typeof supplementPlanFormSchema>;

interface SupplementItemData {
  id: string;
  name: string;
  brand?: string;
  dosage: string;
  frequency: string;
  timing?: string;
  purpose?: string;
  instructions?: string;
  isOptional: boolean;
}

const GOAL_OPTIONS = [
  { value: "recovery", label: "Recovery" },
  { value: "energy", label: "Energy" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "health", label: "General Health" },
  { value: "performance", label: "Performance" },
  { value: "weight_loss", label: "Weight Loss" },
];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "2x daily", label: "2x Daily" },
  { value: "3x daily", label: "3x Daily" },
  { value: "post-workout", label: "Post-Workout" },
  { value: "pre-workout", label: "Pre-Workout" },
  { value: "as needed", label: "As Needed" },
];

const TIMING_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "before bed", label: "Before Bed" },
  { value: "with meals", label: "With Meals" },
  { value: "between meals", label: "Between Meals" },
  { value: "post-workout", label: "Post-Workout" },
  { value: "pre-workout", label: "Pre-Workout" },
];

export default function TrainerSupplements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [supplements, setSupplements] = useState<SupplementItemData[]>([]);

  const form = useForm<SupplementPlanFormData>({
    resolver: zodResolver(supplementPlanFormSchema),
    defaultValues: {
      clientId: "",
      name: "",
      description: "",
      goal: "",
      isActive: true,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      notes: "",
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/trainers/clients"],
    enabled: !!user && user.role === "trainer",
  });

  const { data: supplementPlans = [] } = useQuery<(SupplementPlan & { items?: SupplementItem[] })[]>({
    queryKey: ["/api/nutrition/trainers", user?.trainer?.id, "supplement-plans"],
    enabled: !!user?.trainer?.id,
  });

  const createSupplementPlanMutation = useMutation({
    mutationFn: async (data: { plan: SupplementPlanFormData; supplements: SupplementItemData[] }) => {
      const planResponse = await apiRequest(`/api/nutrition/supplement-plans`, "POST", {
        ...data.plan,
        trainerId: user?.trainer?.id,
      });

      for (const supplement of data.supplements) {
        await apiRequest(`/api/nutrition/supplement-items`, "POST", {
          supplementPlanId: planResponse.id,
          name: supplement.name,
          brand: supplement.brand,
          dosage: supplement.dosage,
          frequency: supplement.frequency,
          timing: supplement.timing,
          purpose: supplement.purpose,
          instructions: supplement.instructions,
          isOptional: supplement.isOptional,
        });
      }

      return planResponse;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplement plan created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/trainers"] });
      setShowCreateDialog(false);
      form.reset();
      setSupplements([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create supplement plan",
        variant: "destructive",
      });
    },
  });

  const addSupplement = () => {
    setSupplements([
      ...supplements,
      {
        id: `supplement-${Date.now()}`,
        name: "",
        brand: "",
        dosage: "",
        frequency: "daily",
        timing: "",
        purpose: "",
        instructions: "",
        isOptional: false,
      },
    ]);
  };

  const removeSupplement = (id: string) => {
    setSupplements(supplements.filter((s) => s.id !== id));
  };

  const updateSupplement = (id: string, updates: Partial<SupplementItemData>) => {
    setSupplements(supplements.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const onSubmit = (data: SupplementPlanFormData) => {
    if (supplements.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one supplement to the plan",
        variant: "destructive",
      });
      return;
    }

    createSupplementPlanMutation.mutate({ plan: data, supplements });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Supplement Plans</h1>
          <p className="text-muted-foreground">Create and manage supplement plans for your clients</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-supplement-plan">
              <Plus className="h-4 w-4 mr-2" />
              Create Supplement Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-supplement-plan">
            <DialogHeader>
              <DialogTitle>Create New Supplement Plan</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-client">
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.user?.firstName} {client.user?.lastName}
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Recovery Stack" data-testid="input-plan-name" />
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
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-end-date" />
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Supplements</h3>
                    <Button type="button" variant="outline" onClick={addSupplement} data-testid="button-add-supplement">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Supplement
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {supplements.map((supplement) => (
                      <Card key={supplement.id} data-testid={`card-supplement-${supplement.id}`}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Supplement Name *</Label>
                                <Input
                                  value={supplement.name}
                                  onChange={(e) => updateSupplement(supplement.id, { name: e.target.value })}
                                  placeholder="e.g., Whey Protein"
                                  data-testid={`input-supplement-name-${supplement.id}`}
                                />
                              </div>
                              <div>
                                <Label>Brand</Label>
                                <Input
                                  value={supplement.brand || ""}
                                  onChange={(e) => updateSupplement(supplement.id, { brand: e.target.value })}
                                  placeholder="e.g., Optimum Nutrition"
                                  data-testid={`input-supplement-brand-${supplement.id}`}
                                />
                              </div>
                              <div>
                                <Label>Dosage *</Label>
                                <Input
                                  value={supplement.dosage}
                                  onChange={(e) => updateSupplement(supplement.id, { dosage: e.target.value })}
                                  placeholder="e.g., 1 scoop, 5g, 2 capsules"
                                  data-testid={`input-supplement-dosage-${supplement.id}`}
                                />
                              </div>
                              <div>
                                <Label>Frequency *</Label>
                                <Select
                                  value={supplement.frequency}
                                  onValueChange={(value) => updateSupplement(supplement.id, { frequency: value })}
                                >
                                  <SelectTrigger data-testid={`select-supplement-frequency-${supplement.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FREQUENCY_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Timing</Label>
                                <Select
                                  value={supplement.timing || ""}
                                  onValueChange={(value) => updateSupplement(supplement.id, { timing: value })}
                                >
                                  <SelectTrigger data-testid={`select-supplement-timing-${supplement.id}`}>
                                    <SelectValue placeholder="Select timing" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIMING_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Purpose</Label>
                                <Input
                                  value={supplement.purpose || ""}
                                  onChange={(e) => updateSupplement(supplement.id, { purpose: e.target.value })}
                                  placeholder="e.g., Muscle recovery"
                                  data-testid={`input-supplement-purpose-${supplement.id}`}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Instructions</Label>
                              <Textarea
                                value={supplement.instructions || ""}
                                onChange={(e) => updateSupplement(supplement.id, { instructions: e.target.value })}
                                rows={2}
                                placeholder="Detailed usage instructions..."
                                data-testid={`textarea-supplement-instructions-${supplement.id}`}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`optional-${supplement.id}`}
                                  checked={supplement.isOptional}
                                  onCheckedChange={(checked) =>
                                    updateSupplement(supplement.id, { isOptional: checked as boolean })
                                  }
                                  data-testid={`checkbox-supplement-optional-${supplement.id}`}
                                />
                                <label
                                  htmlFor={`optional-${supplement.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Optional supplement
                                </label>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSupplement(supplement.id)}
                                data-testid={`button-remove-supplement-${supplement.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {supplements.length === 0 && (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground text-center">
                            No supplements added yet. Click "Add Supplement" to get started.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder="Any special instructions or notes for the client..." data-testid="textarea-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                    disabled={createSupplementPlanMutation.isPending}
                    data-testid="button-save-supplement-plan"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createSupplementPlanMutation.isPending ? "Saving..." : "Save Supplement Plan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supplementPlans.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Pill className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No supplement plans yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first supplement plan to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          supplementPlans.map((plan) => (
            <Card key={plan.id} data-testid={`card-supplement-plan-${plan.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {plan.client?.user?.firstName} {plan.client?.user?.lastName}
                    </CardDescription>
                  </div>
                  {plan.isActive && <Badge variant="default">Active</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plan.goal && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Goal:</span>
                      <Badge variant="outline">{plan.goal}</Badge>
                    </div>
                  )}
                  {plan.startDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{new Date(plan.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {plan.endDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">End Date:</span>
                      <span>{new Date(plan.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
