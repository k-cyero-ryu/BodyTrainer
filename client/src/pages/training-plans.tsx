import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, Dumbbell } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TrainingPlans() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [weeksCycle, setWeeksCycle] = useState<number>(1);
  const [workoutDays, setWorkoutDays] = useState<Record<number, Record<number, string>>>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: plans = [] } = useQuery({
    queryKey: ["/api/training-plans"],
    enabled: !!user && (user.role === 'trainer' || user.role === 'client'),
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/training-plans", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training plan created successfully",
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create training plan",
        variant: "destructive",
      });
    },
  });

  const handleCreatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      goal: formData.get('goal') as string,
      duration: weeksCycle,
      dailyCalories: parseInt(formData.get('dailyCalories') as string),
      protein: parseInt(formData.get('protein') as string),
      carbs: parseInt(formData.get('carbs') as string),
      workoutDays: workoutDays,
    };

    createPlanMutation.mutate(data);
  };

  const handleWeeksCycleChange = (value: string) => {
    const weeks = parseInt(value);
    setWeeksCycle(weeks);
    
    // Initialize workout days for all weeks
    const newWorkoutDays: Record<number, Record<number, string>> = {};
    for (let week = 1; week <= weeks; week++) {
      newWorkoutDays[week] = {};
      for (let day = 1; day <= 6; day++) {
        newWorkoutDays[week][day] = workoutDays[week]?.[day] || '';
      }
    }
    setWorkoutDays(newWorkoutDays);
  };

  const handleWorkoutDayChange = (week: number, day: number, value: string) => {
    setWorkoutDays(prev => ({
      ...prev,
      [week]: {
        ...prev[week],
        [day]: value
      }
    }));
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber - 1];
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setWeeksCycle(1);
    setWorkoutDays({});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'trainer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only trainers can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Training Plans</h1>
        <Button onClick={() => {
          setShowCreateForm(true);
          // Initialize workout days for default 1 week
          if (Object.keys(workoutDays).length === 0) {
            handleWeeksCycleChange("1");
          }
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Training Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePlan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input id="name" name="name" placeholder="e.g., Weight Loss Program" required />
                </div>
                <div>
                  <Label htmlFor="weeksCycle">Weeks Cycle</Label>
                  <Select value={weeksCycle.toString()} onValueChange={handleWeeksCycleChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weeks cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 week</SelectItem>
                      <SelectItem value="2">2 weeks</SelectItem>
                      <SelectItem value="3">3 weeks</SelectItem>
                      <SelectItem value="4">4 weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Describe the plan goals and approach..." 
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="goal">Primary Goal</Label>
                <Input id="goal" name="goal" placeholder="e.g., Lose weight, build muscle" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dailyCalories">Daily Calories</Label>
                  <Input id="dailyCalories" name="dailyCalories" type="number" placeholder="2000" />
                </div>
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input id="protein" name="protein" type="number" placeholder="120" />
                </div>
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input id="carbs" name="carbs" type="number" placeholder="200" />
                </div>
              </div>

              {/* Weekly Workout Days Tabs */}
              {weeksCycle > 0 && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Weekly Workout Schedule</Label>
                  <Tabs defaultValue="1" className="w-full">
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${weeksCycle}, 1fr)` }}>
                      {Array.from({ length: weeksCycle }, (_, i) => i + 1).map((week) => (
                        <TabsTrigger key={week} value={week.toString()}>
                          Week {week}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {Array.from({ length: weeksCycle }, (_, i) => i + 1).map((week) => (
                      <TabsContent key={week} value={week.toString()} className="space-y-4">
                        <h3 className="text-lg font-medium">Week {week} Workouts</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Array.from({ length: 6 }, (_, i) => i + 1).map((day) => (
                            <div key={day}>
                              <Label htmlFor={`week-${week}-day-${day}`}>
                                {getDayName(day)}
                              </Label>
                              <Textarea
                                id={`week-${week}-day-${day}`}
                                placeholder="Enter workout details for this day..."
                                value={workoutDays[week]?.[day] || ''}
                                onChange={(e) => handleWorkoutDayChange(week, day, e.target.value)}
                                rows={3}
                              />
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPlanMutation.isPending}
                >
                  {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans && plans.length > 0 ? (
          plans.map((plan: any) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-500">{plan.duration} weeks</p>
                  </div>
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? "Active" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{plan.description || "No description"}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Goal:</span>
                    <span className="font-medium">{plan.goal || "Not specified"}</span>
                  </div>
                  {plan.dailyCalories && (
                    <div className="flex justify-between">
                      <span>Daily Calories:</span>
                      <span className="font-medium">{plan.dailyCalories} kcal</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-between">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button size="sm">
                    Assign to Client
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No training plans yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first training plan to get started
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Plan
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
