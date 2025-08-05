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
import { CalendarCheck, Weight, Target, Flame, Dumbbell, Play } from "lucide-react";
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

  // Mock client stats - in a real app these would come from API
  const clientStats = {
    workoutsThisWeek: 4,
    totalWorkouts: 5,
    currentWeight: evaluations?.[0]?.weight || user?.client?.weight || 70,
    goalProgress: 75,
    streak: 12,
  };

  const todayExercises = [
    { id: 1, name: "Push-ups", details: "3 sets × 12 reps" },
    { id: 2, name: "Squats", details: "3 sets × 15 reps" },
    { id: 3, name: "Plank", details: "3 sets × 30 seconds" },
    { id: 4, name: "Lunges", details: "3 sets × 10 reps each leg" },
  ];

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your fitness journey and progress</p>
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
              <CardTitle>Today's Workout</CardTitle>
              <p className="text-sm text-gray-500">Upper Body Strength - Day 3</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayExercises.map((exercise) => (
                  <div key={exercise.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                        <p className="text-sm text-gray-500">{exercise.details}</p>
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
              </div>

              <div className="mt-6 flex justify-center">
                <Button className="px-6 py-3">
                  Complete Workout
                </Button>
              </div>
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
