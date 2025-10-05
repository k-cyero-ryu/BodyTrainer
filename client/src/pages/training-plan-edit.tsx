import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Plus, 
  Trash2, 
  Save,
  X
} from "lucide-react";

const trainingPlanFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  goal: z.string().optional(),
  duration: z.string().optional(),
  weeksCycle: z.number().min(1).max(4),
});

type TrainingPlanFormData = z.infer<typeof trainingPlanFormSchema>;

interface PlanExercise {
  id: string;
  exerciseId: string;
  exerciseName?: string;
  dayOfWeek: number;
  week: number;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
}

const GOAL_OPTIONS = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "strength", label: "Strength" },
  { value: "endurance", label: "Endurance" },
  { value: "flexibility", label: "Flexibility" },
  { value: "general_fitness", label: "General Fitness" },
];

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TrainingPlanEdit() {
  const [, params] = useRoute("/training-plans/:planId/edit");
  const planId = params?.planId;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeDay, setActiveDay] = useState<number>(1);
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>([]);
  const [modifiedExercises, setModifiedExercises] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [exerciseForm, setExerciseForm] = useState({
    sets: 3,
    reps: 10,
    weight: 0,
    duration: 0,
    restTime: 60,
    notes: ""
  });

  const form = useForm<TrainingPlanFormData>({
    resolver: zodResolver(trainingPlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      duration: "",
      weeksCycle: 1,
    },
  });

  const { data: plan, isLoading } = useQuery<any>({
    queryKey: [`/api/training-plans/${planId}`],
    enabled: !!planId,
  });

  const { data: exercises = [] } = useQuery<any[]>({
    queryKey: ["/api/exercises"],
    enabled: !!user && user.role === 'trainer',
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name || "",
        description: plan.description || "",
        goal: plan.goal || "",
        duration: plan.duration || "",
        weeksCycle: plan.weeksCycle || 1,
      });
      
      if (plan.exercises && plan.exercises.length > 0) {
        const formattedExercises = plan.exercises.map((ex: any) => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          dayOfWeek: ex.dayOfWeek,
          week: ex.week,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight ? parseFloat(ex.weight) : undefined,
          duration: ex.duration,
          restTime: ex.restTime,
          notes: ex.notes || "",
        }));
        setPlanExercises(formattedExercises);
      }
      setModifiedExercises(new Set()); // Clear modifications when loading fresh data
    }
  }, [plan, form]);

  const updatePlanMutation = useMutation({
    mutationFn: async (data: TrainingPlanFormData) => {
      await apiRequest("PUT", `/api/training-plans/${planId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training plan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/training-plans/${planId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update training plan",
        variant: "destructive",
      });
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/training-plans/${planId}/exercises`, data);
      return response.json();
    },
    onSuccess: (newExercise) => {
      // Add to local state immediately
      if (newExercise) {
        const exerciseName = exercises.find((ex: any) => ex.id === newExercise.exerciseId)?.name || "Unknown";
        setPlanExercises(prev => [...prev, {
          ...newExercise,
          exerciseName,
        }]);
      }
      // Also invalidate to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: [`/api/training-plans/${planId}`] });
      toast({
        title: "Success",
        description: "Exercise added to plan",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add exercise",
        variant: "destructive",
      });
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      await apiRequest("PUT", `/api/plan-exercises/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/training-plans/${planId}`] });
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      await apiRequest("DELETE", `/api/plan-exercises/${exerciseId}`, {});
      return exerciseId;
    },
    onSuccess: (deletedId) => {
      // Remove from local state immediately
      setPlanExercises(prev => prev.filter(ex => ex.id !== deletedId));
      // Remove from modified set if it was there
      setModifiedExercises(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletedId);
        return newSet;
      });
      // Also invalidate to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: [`/api/training-plans/${planId}`] });
      toast({
        title: "Success",
        description: "Exercise removed from plan",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove exercise",
        variant: "destructive",
      });
    },
  });

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setExerciseForm({
      sets: 3,
      reps: 10,
      weight: 0,
      duration: 0,
      restTime: 60,
      notes: ""
    });
    setShowAddDialog(true);
  };

  const handleAddExercise = () => {
    if (!selectedExerciseId) return;
    
    addExerciseMutation.mutate({
      exerciseId: selectedExerciseId,
      dayOfWeek: activeDay,
      week: activeWeek,
      ...exerciseForm,
    });
    setShowAddDialog(false);
    setSelectedExerciseId("");
  };

  const handleUpdateExercise = (id: string, updates: any) => {
    // Update local state only
    setPlanExercises(prev => 
      prev.map(ex => 
        ex.id === id ? { ...ex, ...updates } : ex
      )
    );
    // Track as modified
    setModifiedExercises(prev => new Set(prev).add(id));
  };

  const handleDeleteExercise = (id: string) => {
    deleteExerciseMutation.mutate(id);
  };

  const onSubmit = async (data: TrainingPlanFormData) => {
    try {
      // Save plan metadata
      await apiRequest("PUT", `/api/training-plans/${planId}`, data);
      
      // Save all modified exercises
      const exerciseSavePromises = Array.from(modifiedExercises).map(exerciseId => {
        const exercise = planExercises.find(ex => ex.id === exerciseId);
        if (exercise) {
          return apiRequest("PUT", `/api/plan-exercises/${exerciseId}`, {
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            duration: exercise.duration,
            restTime: exercise.restTime,
            notes: exercise.notes,
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(exerciseSavePromises);
      
      // Clear modifications and invalidate queries
      setModifiedExercises(new Set());
      queryClient.invalidateQueries({ queryKey: [`/api/training-plans/${planId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      
      toast({
        title: "Success",
        description: `Plan and ${modifiedExercises.size} exercise(s) updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update training plan",
        variant: "destructive",
      });
    }
  };

  const getExercisesForDayAndWeek = (day: number, week: number) => {
    return planExercises.filter(ex => ex.dayOfWeek === day && ex.week === week);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">Training plan not found</div>
      </div>
    );
  }

  const weeksCycle = form.watch("weeksCycle");

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/training-plans")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Training Plan</h1>
          <p className="text-muted-foreground">Update plan details and manage exercises</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-plan-name" />
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
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 4 weeks, 2 months" data-testid="input-duration" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weeksCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weeks Cycle</FormLabel>
                      <Select value={field.value.toString()} onValueChange={(v) => field.onChange(parseInt(v))}>
                        <FormControl>
                          <SelectTrigger data-testid="select-weeks-cycle">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4].map((week) => (
                            <SelectItem key={week} value={week.toString()}>
                              {week} {week === 1 ? "Week" : "Weeks"}
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
                      <Textarea {...field} rows={2} data-testid="textarea-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" data-testid="button-save-plan" disabled={updatePlanMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updatePlanMutation.isPending ? "Saving..." : "Save Plan Details"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Exercises</CardTitle>
          <CardDescription>Manage exercises for each day</CardDescription>
        </CardHeader>
        <CardContent>
          {weeksCycle > 1 && (
            <div className="mb-4">
              <Tabs value={activeWeek.toString()} onValueChange={(v) => setActiveWeek(parseInt(v))}>
                <TabsList>
                  {Array.from({ length: weeksCycle }, (_, i) => i + 1).map((week) => (
                    <TabsTrigger key={week} value={week.toString()} data-testid={`tab-week-${week}`}>
                      Week {week}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
          
          <Tabs value={activeDay.toString()} onValueChange={(v) => setActiveDay(parseInt(v))}>
            <TabsList className="grid grid-cols-7 w-full mb-4">
              {DAY_NAMES.map((day, index) => (
                <TabsTrigger key={index + 1} value={(index + 1).toString()} data-testid={`tab-day-${index + 1}`}>
                  {day.slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>
            {DAY_NAMES.map((dayName, dayIndex) => {
              const day = dayIndex + 1;
              const dayExercises = getExercisesForDayAndWeek(day, activeWeek);
              
              return (
                <TabsContent key={day} value={day.toString()} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{dayName} - Week {activeWeek}</h3>
                  </div>

                  <div className="space-y-3">
                    {dayExercises.map((planExercise, index) => (
                      <Card key={planExercise.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold">{planExercise.exerciseName || "Exercise"}</h4>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExercise(planExercise.id)}
                              data-testid={`button-delete-exercise-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground">Sets</label>
                              <Input
                                type="number"
                                value={planExercise.sets || ""}
                                onChange={(e) => handleUpdateExercise(planExercise.id, { sets: parseInt(e.target.value) || null })}
                                data-testid={`input-sets-${index}`}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Reps</label>
                              <Input
                                type="number"
                                value={planExercise.reps || ""}
                                onChange={(e) => handleUpdateExercise(planExercise.id, { reps: parseInt(e.target.value) || null })}
                                data-testid={`input-reps-${index}`}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Weight (kg)</label>
                              <Input
                                type="number"
                                step="0.5"
                                value={planExercise.weight || ""}
                                onChange={(e) => handleUpdateExercise(planExercise.id, { weight: parseFloat(e.target.value) || null })}
                                data-testid={`input-weight-${index}`}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Duration (min)</label>
                              <Input
                                type="number"
                                value={planExercise.duration || ""}
                                onChange={(e) => handleUpdateExercise(planExercise.id, { duration: parseInt(e.target.value) || null })}
                                data-testid={`input-duration-${index}`}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Rest (sec)</label>
                              <Input
                                type="number"
                                value={planExercise.restTime || ""}
                                onChange={(e) => handleUpdateExercise(planExercise.id, { restTime: parseInt(e.target.value) || null })}
                                data-testid={`input-rest-${index}`}
                              />
                            </div>
                          </div>

                          <Textarea
                            placeholder="Exercise notes (optional)"
                            value={planExercise.notes || ""}
                            onChange={(e) => handleUpdateExercise(planExercise.id, { notes: e.target.value })}
                            rows={2}
                            className="mt-3"
                            data-testid={`textarea-notes-${index}`}
                          />
                        </CardContent>
                      </Card>
                    ))}

                    {dayExercises.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No exercises added for this day.
                      </div>
                    )}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Add Exercise</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={selectedExerciseId} onValueChange={handleSelectExercise}>
                        <SelectTrigger data-testid={`select-add-exercise-day-${day}`}>
                          <SelectValue placeholder="Select an exercise to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {exercises.map((exercise: any) => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.name} {exercise.category && `(${exercise.category})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Exercise Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exercise Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sets</label>
                <Input
                  type="number"
                  value={exerciseForm.sets}
                  onChange={(e) => setExerciseForm({...exerciseForm, sets: parseInt(e.target.value) || 0})}
                  data-testid="dialog-input-sets"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reps</label>
                <Input
                  type="number"
                  value={exerciseForm.reps}
                  onChange={(e) => setExerciseForm({...exerciseForm, reps: parseInt(e.target.value) || 0})}
                  data-testid="dialog-input-reps"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Weight (kg)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={exerciseForm.weight}
                  onChange={(e) => setExerciseForm({...exerciseForm, weight: parseFloat(e.target.value) || 0})}
                  data-testid="dialog-input-weight"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rest (sec)</label>
                <Input
                  type="number"
                  value={exerciseForm.restTime}
                  onChange={(e) => setExerciseForm({...exerciseForm, restTime: parseInt(e.target.value) || 0})}
                  data-testid="dialog-input-rest"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (min)</label>
                <Input
                  type="number"
                  value={exerciseForm.duration}
                  onChange={(e) => setExerciseForm({...exerciseForm, duration: parseInt(e.target.value) || 0})}
                  data-testid="dialog-input-duration"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={exerciseForm.notes}
                onChange={(e) => setExerciseForm({...exerciseForm, notes: e.target.value})}
                placeholder="Exercise notes..."
                rows={3}
                data-testid="dialog-textarea-notes"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} data-testid="dialog-button-cancel">
              Cancel
            </Button>
            <Button onClick={handleAddExercise} data-testid="dialog-button-add">
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
