import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Weight, Target, Flame, Dumbbell, Play, CreditCard, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ClientDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);

  // Redirect to login if not authenticated
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

  const { data: evaluations = [] } = useQuery({
    queryKey: ["/api/evaluations"],
    enabled: !!user && user.role === 'client',
  });

  // Fetch client's assigned training plans
  const { data: assignedPlans = [] } = useQuery({
    queryKey: ["/api/client/assigned-plans"],
    enabled: !!user && user.role === 'client',
  });

  // Fetch client's payment plan
  const { data: paymentPlan } = useQuery({
    queryKey: ["/api/client/payment-plan"],
    enabled: !!user && user.role === 'client',
  });

  // Fetch today's workout
  const { data: todayWorkout } = useQuery({
    queryKey: ["/api/client/today-workout"],
    enabled: !!user && user.role === 'client',
  });

  // Fetch training plans list
  const { data: trainingPlans = [] } = useQuery({
    queryKey: ["/api/training-plans"],
    enabled: !!user && user.role === 'client',
  });

  const evaluationMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/evaluations", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Monthly evaluation submitted successfully",
      });
      setShowEvaluationForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
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
        description: "Failed to submit evaluation",
        variant: "destructive",
      });
    },
  });

  const handleEvaluationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      weekNumber: parseInt(formData.get('weekNumber') as string),
      weight: parseFloat(formData.get('weight') as string),
      bodyFatPercentage: parseFloat(formData.get('bodyFat') as string),
      waistMeasurement: parseFloat(formData.get('waist') as string),
      chestMeasurement: parseFloat(formData.get('chest') as string),
      bicepsMeasurement: parseFloat(formData.get('biceps') as string),
      trainingAdherence: parseInt(formData.get('trainingAdherence') as string),
      mealAdherence: parseInt(formData.get('mealAdherence') as string),
      selfEvaluation: parseInt(formData.get('selfEvaluation') as string),
    };

    evaluationMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate client stats from real data
  const latestEvaluation = evaluations?.[0];
  const currentWeight = latestEvaluation?.weight || 0;
  const activeAssignedPlan = assignedPlans.find((p: any) => p.isActive);
  
  // Calculate workout completion stats
  const totalWorkoutsThisWeek = activeAssignedPlan ? 5 : 0; // Assume 5 workouts per week if plan exists
  const completedWorkoutsThisWeek = todayWorkout?.workout ? 4 : 0; // Mock completion for now
  
  const clientStats = {
    workoutsThisWeek: completedWorkoutsThisWeek,
    totalWorkouts: totalWorkoutsThisWeek,
    currentWeight: currentWeight,
    goalProgress: activeAssignedPlan ? 75 : 0, // Mock progress
    streak: 12, // Mock streak - could be calculated from workout history
  };

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your fitness journey and progress</p>
      </div>

      {/* Current Payment Plan and Training Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Payment Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Payment Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentPlan ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Plan:</span>
                  <span className="text-sm">{paymentPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Price:</span>
                  <span className="text-sm font-bold">${paymentPlan.price}/{paymentPlan.billingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Sessions:</span>
                  <span className="text-sm">{paymentPlan.sessionsPerWeek} per week</span>
                </div>
                {paymentPlan.features && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {paymentPlan.features.map((feature: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No payment plan assigned yet</p>
                <p className="text-xs text-muted-foreground mt-1">Contact your trainer to set up a plan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Training Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Current Training Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedPlans.length > 0 ? (
              <div className="space-y-3">
                {assignedPlans.map((plan: any) => (
                  <div key={plan.planId} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground">{plan.goal}</p>
                      </div>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration: {plan.duration} weeks</span>
                      <span>Status: {plan.status}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>Started: {new Date(plan.assignedDate).toLocaleDateString()}</span>
                      <Link href={`/training-plans/${plan.planId}`}>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No training plan assigned yet</p>
                <p className="text-xs text-muted-foreground mt-1">Your trainer will assign a plan soon</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary/10">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Workouts This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clientStats.workoutsThisWeek}/{clientStats.totalWorkouts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Weight className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Weight</p>
                <p className="text-2xl font-bold text-gray-900">{clientStats.currentWeight} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Goal Progress</p>
                <p className="text-2xl font-bold text-gray-900">{clientStats.goalProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Streak</p>
                <p className="text-2xl font-bold text-gray-900">{clientStats.streak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Today's Workout */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Workout
              </CardTitle>
              {todayWorkout?.workout && (
                <p className="text-sm text-gray-500">
                  {todayWorkout.planDetails.name} - Day {todayWorkout.workout.dayOfWeek}, Week {todayWorkout.workout.week}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {todayWorkout?.workout?.exercises && todayWorkout.workout.exercises.length > 0 ? (
                <div className="space-y-4">
                  {todayWorkout.workout.exercises.map((exercise: any) => (
                    <div key={exercise.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Dumbbell className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{exercise.exerciseName}</h4>
                          <div className="text-sm text-gray-500 space-y-1">
                            {exercise.sets && <span>Sets: {exercise.sets}</span>}
                            {exercise.reps && <span> • Reps: {exercise.reps}</span>}
                            {exercise.duration && <span> • Duration: {exercise.duration} min</span>}
                            {exercise.weight && <span> • Weight: {exercise.weight} kg</span>}
                          </div>
                          {exercise.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{exercise.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                        <input type="checkbox" className="rounded border-gray-300" />
                      </div>
                    </div>
                  ))}
                  <div className="mt-6 flex justify-center">
                    <Button className="px-6 py-3">
                      Complete Workout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {todayWorkout?.message || "No workout scheduled for today"}
                  </p>
                  {todayWorkout?.message === "No active training plan assigned" && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Your trainer will assign a training plan soon
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Chart */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Weight Goal</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Strength</span>
                    <span>60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Endurance</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">This Month's Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Workouts:</span>
                    <span className="font-medium">16/20</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight Change:</span>
                    <span className="font-medium text-green-600">-2.5 kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Streak:</span>
                    <span className="font-medium">12 days</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Training Plans Section */}
      {trainingPlans.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              My Training Plans
            </CardTitle>
            <p className="text-sm text-gray-500">View and track your assigned training plans</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainingPlans.map((plan: any) => (
                <div key={plan.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{plan.name}</h4>
                      <p className="text-sm text-muted-foreground">{plan.goal}</p>
                    </div>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{plan.duration} weeks</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="capitalize">{plan.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Started:</span>
                      <span>{new Date(plan.assignedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <Link href={`/training-plans/${plan.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Full Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Evaluation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Evaluation</CardTitle>
          <p className="text-sm text-gray-500">Track your progress with monthly measurements</p>
        </CardHeader>
        <CardContent>
          {!showEvaluationForm ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Submit your monthly evaluation to track progress</p>
              <Button onClick={() => setShowEvaluationForm(true)}>
                Start Evaluation
              </Button>
            </div>
          ) : (
            <form onSubmit={handleEvaluationSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Body Measurements */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Body Measurements (cm)</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="waist">Waist</Label>
                      <Input id="waist" name="waist" type="number" placeholder="80" required />
                    </div>
                    <div>
                      <Label htmlFor="chest">Chest</Label>
                      <Input id="chest" name="chest" type="number" placeholder="95" required />
                    </div>
                    <div>
                      <Label htmlFor="biceps">Biceps</Label>
                      <Input id="biceps" name="biceps" type="number" placeholder="32" required />
                    </div>
                  </div>
                </div>

                {/* Physical Stats */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Physical Stats</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input id="weight" name="weight" type="number" step="0.1" placeholder="68" required />
                    </div>
                    <div>
                      <Label htmlFor="bodyFat">Body Fat %</Label>
                      <Input id="bodyFat" name="bodyFat" type="number" step="0.1" placeholder="18" required />
                    </div>
                    <div>
                      <Label htmlFor="weekNumber">Week #</Label>
                      <Input id="weekNumber" name="weekNumber" type="number" placeholder="8" required />
                    </div>
                  </div>
                </div>

                {/* Self-Evaluation */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Self-Evaluation (1-10)</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="trainingAdherence">Training Adherence</Label>
                      <Select name="trainingAdherence" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(10)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1} - {i + 1 === 10 ? 'Perfect' : i + 1 >= 8 ? 'Excellent' : i + 1 >= 6 ? 'Good' : 'Needs Improvement'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="mealAdherence">Meal Plan Adherence</Label>
                      <Select name="mealAdherence" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(10)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1} - {i + 1 === 10 ? 'Perfect' : i + 1 >= 8 ? 'Excellent' : i + 1 >= 6 ? 'Good' : 'Needs Improvement'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="selfEvaluation">Overall Satisfaction</Label>
                      <Select name="selfEvaluation" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(10)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1} - {i + 1 === 10 ? 'Perfect' : i + 1 >= 8 ? 'Excellent' : i + 1 >= 6 ? 'Good' : 'Needs Improvement'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEvaluationForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={evaluationMutation.isPending}
                >
                  {evaluationMutation.isPending ? "Submitting..." : "Submit Evaluation"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
