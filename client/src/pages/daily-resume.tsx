import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  Apple, 
  Plus,
  ChevronLeft, 
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  Activity
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Food Entry Form Schema
const foodEntrySchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  description: z.string().min(1, "Food description is required"),
  quantity: z.string().min(1, "Quantity is required"),
  notes: z.string().optional(),
});

// Cardio Activity Form Schema
const cardioActivitySchema = z.object({
  activityType: z.string().min(1, "Activity type is required"),
  duration: z.string().min(1, "Duration is required"),
  distance: z.string().optional(),
  notes: z.string().optional(),
});

type FoodEntryFormData = z.infer<typeof foodEntrySchema>;
type CardioActivityFormData = z.infer<typeof cardioActivitySchema>;

export default function DailyResume() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isFoodDialogOpen, setIsFoodDialogOpen] = useState(false);
  const [isCardioDialogOpen, setIsCardioDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<any>(null);
  const [editingCardio, setEditingCardio] = useState<any>(null);

  const foodForm = useForm<FoodEntryFormData>({
    resolver: zodResolver(foodEntrySchema),
    defaultValues: {
      mealType: 'breakfast',
      description: '',
      quantity: '',
      notes: '',
    },
  });

  const cardioForm = useForm<CardioActivityFormData>({
    resolver: zodResolver(cardioActivitySchema),
    defaultValues: {
      activityType: '',
      duration: '',
      distance: '',
      notes: '',
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: t('auth.unauthorized'),
        description: t('auth.loggedOutRetry'),
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch food entries for selected date
  const { data: foodEntries, isLoading: loadingFood } = useQuery({
    queryKey: ['/api/client/food-entries', { date: selectedDate }],
    enabled: isAuthenticated && selectedDate !== '',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  // Fetch cardio activities for selected date
  const { data: cardioActivities, isLoading: loadingCardio } = useQuery({
    queryKey: ['/api/client/cardio-activities', { date: selectedDate }],
    enabled: isAuthenticated && selectedDate !== '',
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  // Create food entry mutation
  const createFoodMutation = useMutation({
    mutationFn: (data: FoodEntryFormData) => 
      apiRequest("POST", `/api/client/food-entries`, {
        ...data,
        date: selectedDate, // Send as string, backend will transform to Date
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/food-entries', { date: selectedDate }] });
      setIsFoodDialogOpen(false);
      foodForm.reset();
      toast({
        title: t('common.success'),
        description: "Food entry added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: "Failed to add food entry",
        variant: "destructive",
      });
    },
  });

  // Create cardio activity mutation
  const createCardioMutation = useMutation({
    mutationFn: (data: CardioActivityFormData) => 
      apiRequest("POST", `/api/client/cardio-activities`, {
        ...data,
        duration: parseInt(data.duration),
        distance: data.distance ? parseFloat(data.distance) : null,
        date: selectedDate, // Send as string, backend will transform to Date
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/cardio-activities', { date: selectedDate }] });
      setIsCardioDialogOpen(false);
      cardioForm.reset();
      toast({
        title: t('common.success'),
        description: "Cardio activity added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: "Failed to add cardio activity",
        variant: "destructive",
      });
    },
  });

  // Delete food entry mutation
  const deleteFoodMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/client/food-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/food-entries', { date: selectedDate }] });
      toast({
        title: t('common.success'),
        description: "Food entry deleted successfully",
      });
    },
  });

  // Delete cardio activity mutation
  const deleteCardioMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/client/cardio-activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/cardio-activities', { date: selectedDate }] });
      toast({
        title: t('common.success'),
        description: "Cardio activity deleted successfully",
      });
    },
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    // Parse the date string directly to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day); // month is 0-indexed
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    const newYear = newDate.getFullYear();
    const newMonth = String(newDate.getMonth() + 1).padStart(2, '0');
    const newDay = String(newDate.getDate()).padStart(2, '0');
    setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
  };

  const goToToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const onSubmitFood = (data: FoodEntryFormData) => {
    createFoodMutation.mutate(data);
  };

  const onSubmitCardio = (data: CardioActivityFormData) => {
    createCardioMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = selectedDate === today;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('nav.dailyResume')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your daily nutrition and cardio activities
          </p>
        </div>
      </div>

      {/* Date Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(selectedDate)}
              </h2>
              {!isToday && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {t('dailyWorkout.today')}
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Food Entries */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-5 w-5" />
                Food & Nutrition
              </CardTitle>
              <Dialog open={isFoodDialogOpen} onOpenChange={setIsFoodDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => foodForm.reset()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Food
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Food Entry</DialogTitle>
                  </DialogHeader>
                  <Form {...foodForm}>
                    <form onSubmit={foodForm.handleSubmit(onSubmitFood)} className="space-y-4">
                      <FormField
                        control={foodForm.control}
                        name="mealType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meal Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="breakfast">Breakfast</SelectItem>
                                <SelectItem value="lunch">Lunch</SelectItem>
                                <SelectItem value="dinner">Dinner</SelectItem>
                                <SelectItem value="snack">Snack</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={foodForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Food Description</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Grilled chicken breast" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={foodForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity (grams)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 150" type="number" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={foodForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Any additional notes..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsFoodDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createFoodMutation.isPending}>
                          {createFoodMutation.isPending ? 'Adding...' : 'Add Entry'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadingFood ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : foodEntries && Array.isArray(foodEntries) && foodEntries.length > 0 ? (
              <div className="space-y-4">
                {foodEntries.map((entry: any) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {entry.mealType}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {entry.quantity}g
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {entry.description}
                        </h3>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteFoodMutation.mutate(entry.id)}
                        disabled={deleteFoodMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Apple className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No food entries for this day</p>
                <p className="text-sm text-gray-400">Add your meals to start tracking</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cardio Activities */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Cardio Activities
              </CardTitle>
              <Dialog open={isCardioDialogOpen} onOpenChange={setIsCardioDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => cardioForm.reset()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Cardio Activity</DialogTitle>
                  </DialogHeader>
                  <Form {...cardioForm}>
                    <form onSubmit={cardioForm.handleSubmit(onSubmitCardio)} className="space-y-4">
                      <FormField
                        control={cardioForm.control}
                        name="activityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Activity Type</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Running, Walking, Dancing" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={cardioForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 30" type="number" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={cardioForm.control}
                        name="distance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Distance (km) - Optional</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 5.5" type="number" step="0.1" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={cardioForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Any additional notes..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCardioDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createCardioMutation.isPending}>
                          {createCardioMutation.isPending ? 'Adding...' : 'Add Activity'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCardio ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : cardioActivities && Array.isArray(cardioActivities) && cardioActivities.length > 0 ? (
              <div className="space-y-4">
                {cardioActivities.map((activity: any) => (
                  <div key={activity.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                          {activity.activityType}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {activity.duration} min
                          </div>
                          {activity.distance && (
                            <div>
                              {activity.distance} km
                            </div>
                          )}
                        </div>
                        {activity.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {activity.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteCardioMutation.mutate(activity.id)}
                        disabled={deleteCardioMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No cardio activities for this day</p>
                <p className="text-sm text-gray-400">Add activities to start tracking</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}