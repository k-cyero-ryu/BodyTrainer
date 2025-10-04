import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { apiRequest } from "@/lib/queryClient";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isUnauthorizedError } from "@/lib/authUtils";
import Chat from "@/components/chat";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Target, 
  Activity, 
  MessageCircle, 
  Edit, 
  ArrowLeft,
  Weight,
  Ruler,
  TrendingUp,
  Clock,
  X,
  Plus,
  Users,
  Heart,
  Apple,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  UtensilsCrossed,
  Pill
} from "lucide-react";

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const formatBillingCycle = (type: string, t: any) => {
  switch (type) {
    case "monthly":
      return t('editClient.monthly');
    case "weekly":
      return t('editClient.weekly');
    case "per_session":
      return t('editClient.perSession');
    default:
      return type;
  }
};

export default function ClientDetail() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [match, params] = useRoute("/clients/:clientId");
  const clientId = params?.clientId;
  const [showChat, setShowChat] = useState(false);
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [planAssignmentType, setPlanAssignmentType] = useState<'training' | 'meal' | 'supplement'>('training');
  const [showCalorieGoalModal, setShowCalorieGoalModal] = useState(false);
  const [newCalorieGoal, setNewCalorieGoal] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ["/api/clients", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch client');
      return response.json();
    },
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  const { data: assignedPlans = [] } = useQuery({
    queryKey: [`/api/client-plans/${clientId}`],
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  // Load client's assigned meal plan
  const { data: assignedMealPlan } = useQuery({
    queryKey: [`/api/nutrition/clients/${clientId}/meal-plan-assignments/active`],
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  // Load client's assigned supplement plan
  const { data: assignedSupplementPlan } = useQuery({
    queryKey: [`/api/nutrition/clients/${clientId}/supplement-plan-assignments/active`],
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ["/api/evaluations", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/evaluations?clientId=${clientId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch evaluations');
      return response.json();
    },
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  // Load client payment plan details if client has one assigned
  const { data: clientPaymentPlan } = useQuery({
    queryKey: [`/api/client-payment-plans/${client?.clientPaymentPlanId}`],
    enabled: !!client?.clientPaymentPlanId && !!user && user.role === 'trainer',
  });

  // Load trainer's training plans for assignment
  const { data: availablePlans = [] } = useQuery({
    queryKey: ["/api/training-plans"],
    enabled: !!user && user.role === 'trainer' && showAssignPlanModal && planAssignmentType === 'training',
  });

  // Load trainer's meal plan templates for assignment
  const { data: availableMealPlans = [] } = useQuery({
    queryKey: [`/api/nutrition/trainers/${client?.trainerId}/meal-plans`],
    enabled: !!client?.trainerId && showAssignPlanModal && planAssignmentType === 'meal',
  });

  // Load trainer's supplement plan templates for assignment
  const { data: availableSupplementPlans = [] } = useQuery({
    queryKey: [`/api/nutrition/trainers/${client?.trainerId}/supplement-plans`],
    enabled: !!client?.trainerId && showAssignPlanModal && planAssignmentType === 'supplement',
  });

  // Load client's recent daily resume data
  const { data: foodEntries = [] } = useQuery({
    queryKey: ["/api/clients", clientId, "food-entries"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/food-entries?limit=5`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch food entries');
      return response.json();
    },
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  const { data: cardioActivities = [] } = useQuery({
    queryKey: ["/api/clients", clientId, "cardio-activities"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/cardio-activities?limit=5`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch cardio activities');
      return response.json();
    },
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  // Load client's calorie data
  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const { data: calorieSummary } = useQuery({
    queryKey: ["/api/clients", clientId, "calories", "summary", formatDateForAPI(selectedDate)],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/calories/summary/${formatDateForAPI(selectedDate)}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch calorie summary');
      return response.json();
    },
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  const { data: clientCalorieGoal } = useQuery({
    queryKey: ["/api/clients", clientId, "calories", "goal"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/calories/goal`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch calorie goal');
      return response.json();
    },
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  // Load recent custom calorie entries
  const { data: customCalorieEntries = [] } = useQuery({
    queryKey: ["/api/clients", clientId, "custom-calorie-entries"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/custom-calorie-entries?limit=5`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch custom calorie entries');
      return response.json();
    },
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  const suspendMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/clients/${clientId}/suspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      toast({
        title: "Success",
        description: "Client suspended successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/clients/${clientId}/reactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      toast({
        title: "Success",
        description: "Client reactivated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignPlanMutation = useMutation({
    mutationFn: async ({ planId, startDate, endDate }: any) => {
      await apiRequest("POST", "/api/client-plans", {
        planId,
        clientId,
        startDate,
        endDate,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client-plans/${clientId}`] });
      toast({
        title: "Success",
        description: "Training plan assigned successfully",
      });
      setShowAssignPlanModal(false);
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
        description: "Failed to assign training plan",
        variant: "destructive",
      });
    },
  });

  const assignMealPlanMutation = useMutation({
    mutationFn: async ({ mealPlanId, clientId, startDate, isActive }: any) => {
      await apiRequest("POST", "/api/nutrition/meal-plan-assignments", {
        mealPlanId,
        clientId,
        startDate,
        isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/clients/${clientId}/meal-plan-assignments/active`] });
      toast({
        title: "Success",
        description: "Meal plan assigned successfully",
      });
      setShowAssignPlanModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign meal plan",
        variant: "destructive",
      });
    },
  });

  const assignSupplementPlanMutation = useMutation({
    mutationFn: async ({ supplementPlanId, clientId, startDate, isActive }: any) => {
      await apiRequest("POST", "/api/nutrition/supplement-plan-assignments", {
        supplementPlanId,
        clientId,
        trainerId: client?.trainerId,
        startDate,
        isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/clients/${clientId}/supplement-plan-assignments/active`] });
      toast({
        title: "Success",
        description: "Supplement plan assigned successfully",
      });
      setShowAssignPlanModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign supplement plan",
        variant: "destructive",
      });
    },
  });

  const updateCalorieGoalMutation = useMutation({
    mutationFn: async (goal: number) => {
      return await apiRequest('PUT', `/api/clients/${clientId}/calories/goal`, { goal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "calories", "goal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "calories", "summary"] });
      toast({
        title: "Success",
        description: "Calorie goal updated successfully",
      });
      setShowCalorieGoalModal(false);
      setNewCalorieGoal("");
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
        description: "Failed to update calorie goal",
        variant: "destructive",
      });
    },
  });

  if (isLoading || clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'trainer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">This page is only available to trainers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Client Not Found</h2>
            <p className="text-muted-foreground">The requested client could not be found.</p>
            <Link href="/clients">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('editClient.backToClients')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getUserInitials = () => {
    const firstName = client.user?.firstName || client.firstName || '';
    const lastName = client.user?.lastName || client.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'CL';
  };

  const getUserDisplayName = () => {
    const firstName = client.user?.firstName || client.firstName || '';
    const lastName = client.user?.lastName || client.lastName || '';
    return `${firstName} ${lastName}`.trim() || client.user?.email || 'Unknown Client';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('editClient.backToClients')}
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={client.user?.profileImageUrl} alt={getUserDisplayName()} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{getUserDisplayName()}</h1>
              <p className="text-muted-foreground">{client.user?.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(client.user?.status || 'inactive')}>
            {client.user?.status || 'inactive'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-assign-plan"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('clientDetail.assignPlan')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => {
                  setPlanAssignmentType('training');
                  setShowAssignPlanModal(true);
                }}
                data-testid="menu-assign-training-plan"
              >
                <Dumbbell className="h-4 w-4 mr-2" />
                Training Plan
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setPlanAssignmentType('meal');
                  setShowAssignPlanModal(true);
                }}
                data-testid="menu-assign-meal-plan"
              >
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                Meal Plan
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setPlanAssignmentType('supplement');
                  setShowAssignPlanModal(true);
                }}
                data-testid="menu-assign-supplement-plan"
              >
                <Pill className="h-4 w-4 mr-2" />
                Supplement Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowChat(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {t('clientDetail.message')}
          </Button>
          <Link href={`/clients/${clientId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              {t('clientDetail.edit')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('clientDetail.clientInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.user?.email || client.email}</span>
              </div>
              
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              
              {(client.age || client.dateOfBirth) && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {client.age ? `${client.age} ${t('clientDetail.yearsOld')}` : 
                     client.dateOfBirth ? `Born ${new Date(client.dateOfBirth).toLocaleDateString()}` : ''}
                  </span>
                </div>
              )}
              
              {client.height && (
                <div className="flex items-center gap-3">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.height} cm</span>
                </div>
              )}
              
              {(client.currentWeight || client.weight) && (
                <div className="flex items-center gap-3">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t('clientDetail.current')} {client.currentWeight || client.weight} kg</span>
                </div>
              )}
              
              {client.targetWeight && (
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t('clientDetail.target')} {client.targetWeight} kg</span>
                </div>
              )}
              
              {client.activityLevel && (
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t('clientDetail.activity')} {client.activityLevel}</span>
                </div>
              )}
              
              {client.referralSource && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{t('clientDetail.referral')} {client.referralSource}</span>
                </div>
              )}
              
              {(client.goals || client.bodyGoal) && (
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t('clientDetail.goals')}</p>
                    <p className="text-sm text-muted-foreground">{client.goals || client.bodyGoal}</p>
                  </div>
                </div>
              )}
              
              {client.medicalConditions && (
                <div className="flex items-start gap-3">
                  <Heart className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t('clientDetail.medicalConditions')}</p>
                    <p className="text-sm text-muted-foreground">{client.medicalConditions}</p>
                  </div>
                </div>
              )}
              
              {client.dietaryRestrictions && (
                <div className="flex items-start gap-3">
                  <Apple className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t('clientDetail.dietaryRestrictions')}</p>
                    <p className="text-sm text-muted-foreground">{client.dietaryRestrictions}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('clientDetail.paymentInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{t('clientDetail.status')}</span>
                <Badge className={getPaymentStatusColor(client.paymentStatus || 'inactive')}>
                  {client.paymentStatus || 'inactive'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{t('clientDetail.plan')}</span>
                {clientPaymentPlan ? (
                  <div className="text-right">
                    <div className="text-sm font-medium">{clientPaymentPlan.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(clientPaymentPlan.amount, clientPaymentPlan.currency)} ({formatBillingCycle(clientPaymentPlan.type, t)})
                    </div>
                  </div>
                ) : (
                  <span className="text-sm">{t('clientDetail.none')}</span>
                )}
              </div>

            </CardContent>
          </Card>


        </div>

        {/* Right Column - Training Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Training Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('clientDetail.trainingPlans')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedPlans.length > 0 ? (
                <div className="space-y-3">
                  {assignedPlans.map((clientPlan: any) => (
                    <div key={clientPlan.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/training-plans/${clientPlan.planId}`}>
                          <h3 className="font-medium hover:text-primary cursor-pointer">{clientPlan.plan?.name}</h3>
                        </Link>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{clientPlan.plan?.difficulty}</Badge>
                          {clientPlan.isActive && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{clientPlan.plan?.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {clientPlan.plan?.duration === 0 ? 'Till goal is met' : `${clientPlan.plan?.duration} weeks`}
                        </span>
                        <span>Cycle: {clientPlan.plan?.weekCycle || 1}w</span>
                        <span>{clientPlan.plan?.exercises?.length || 0} exercises</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(clientPlan.startDate).toLocaleDateString()} - {new Date(clientPlan.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{t('clientDetail.noTrainingPlans')}</p>
              )}
            </CardContent>
          </Card>

          {/* Meal Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Meal Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedMealPlan ? (
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{assignedMealPlan.mealPlan?.name}</h3>
                    <div className="flex items-center gap-2">
                      {assignedMealPlan.isActive && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{assignedMealPlan.mealPlan?.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Started: {new Date(assignedMealPlan.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No meal plans assigned yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Supplement Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Supplement Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedSupplementPlan ? (
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{assignedSupplementPlan.supplementPlan?.name}</h3>
                    <div className="flex items-center gap-2">
                      {assignedSupplementPlan.isActive && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{assignedSupplementPlan.supplementPlan?.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Started: {new Date(assignedSupplementPlan.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No supplement plans assigned yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Evaluations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('clientDetail.recentEvaluations')}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/clients/${clientId}/evaluations`}>
                    <Button variant="outline" size="sm">
                      {t('clientDetail.viewAll')}
                    </Button>
                  </Link>
                  <Link href={`/clients/${clientId}/evaluations/compare`}>
                    <Button variant="secondary" size="sm">
                      {t('clientDetail.compare')}
                    </Button>
                  </Link>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluations.length > 0 ? (
                <div className="space-y-4">
                  {evaluations.slice(0, 3).map((evaluation: any) => (
                    <div key={evaluation.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">
                          Week {evaluation.weekNumber} - {new Date(evaluation.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short',
                            day: 'numeric'
                          })}
                        </h3>
                        <Badge variant="outline">Self Score: {evaluation.selfEvaluation}/10</Badge>
                      </div>
                      {evaluation.notes && (
                        <p className="text-sm text-muted-foreground">{evaluation.notes}</p>
                      )}
                      <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="font-medium">Training: </span>
                          <span>{evaluation.trainingAdherence}/10</span>
                        </div>
                        <div>
                          <span className="font-medium">Nutrition: </span>
                          <span>{evaluation.mealAdherence}/10</span>
                        </div>
                        <div>
                          <span className="font-medium">Weight: </span>
                          <span>{evaluation.weight} kg</span>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-medium">Body Fat: </span>
                          <span>{evaluation.bodyFatPercentage}%</span>
                        </div>
                        <div>
                          <span className="font-medium">Waist: </span>
                          <span>{evaluation.waistMeasurement} cm</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <Link href={`/clients/${clientId}/evaluation/${evaluation.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Full Evaluation
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">{t('clientDetail.noEvaluations')}</p>
              )}
            </CardContent>
          </Card>

          {/* Calorie Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Calorie Management
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCalorieGoalModal(true)}
                    data-testid="button-update-goal"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Update Goal
                  </Button>
                  <Link href={`/clients/${clientId}/calorie-tracker`}>
                    <Button variant="outline" size="sm" data-testid="link-full-tracker">
                      View Full Tracker
                    </Button>
                  </Link>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() - 1);
                      setSelectedDate(newDate);
                    }}
                    data-testid="button-previous-day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-sm min-w-[120px] text-center" data-testid="text-selected-date">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      year: selectedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setSelectedDate(newDate);
                    }}
                    data-testid="button-next-day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  disabled={formatDateForAPI(selectedDate) === formatDateForAPI(new Date())}
                  data-testid="button-today"
                >
                  Today
                </Button>
              </div>

              {/* Calorie Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-calories-consumed">
                      {calorieSummary?.total || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Calories Consumed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-calorie-goal">
                      {clientCalorieGoal?.goal || calorieSummary?.goal || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Daily Goal</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      (calorieSummary?.total || 0) <= (clientCalorieGoal?.goal || calorieSummary?.goal || 0) 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`} data-testid="text-calories-remaining">
                      {(clientCalorieGoal?.goal || calorieSummary?.goal || 0) - (calorieSummary?.total || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(calorieSummary?.total || 0) <= (clientCalorieGoal?.goal || calorieSummary?.goal || 0) ? 'Remaining' : 'Over Goal'}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Progress</span>
                    <span data-testid="text-progress-percentage">
                      {Math.round(((calorieSummary?.total || 0) / Math.max(clientCalorieGoal?.goal || calorieSummary?.goal || 1, 1)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(((calorieSummary?.total || 0) / Math.max(clientCalorieGoal?.goal || calorieSummary?.goal || 1, 1)) * 100, 100)} 
                    className="h-2"
                    data-testid="progress-calorie"
                  />
                </div>

                {/* Breakdown */}
                {calorieSummary?.breakdown && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium" data-testid="text-food-entries-calories">{calorieSummary.breakdown.foodEntries}</div>
                      <div className="text-muted-foreground">From Meals</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium" data-testid="text-custom-entries-calories">{calorieSummary.breakdown.customEntries}</div>
                      <div className="text-muted-foreground">Quick Entries</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Custom Calorie Entries */}
              {customCalorieEntries.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Recent Quick Calorie Entries
                  </h4>
                  <div className="space-y-2">
                    {customCalorieEntries.slice(0, 3).map((entry: any) => (
                      <div key={entry.id} className="p-3 border rounded-lg text-sm" data-testid={`card-custom-entry-${entry.id}`}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            {entry.mealType && (
                              <Badge variant="secondary" className="text-xs capitalize">
                                {entry.mealType}
                              </Badge>
                            )}
                            <span className="font-medium">{entry.description}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-orange-600 dark:text-orange-400" data-testid={`text-entry-calories-${entry.id}`}>
                              {entry.calories} cal
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString('en-US', { 
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Daily Resume */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Apple className="h-5 w-5" />
                  Daily Resume
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/clients/${clientId}/daily-resume`}>
                    <Button variant="outline" size="sm">
                      View Full Resume
                    </Button>
                  </Link>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Recent Food Entries */}
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Apple className="h-4 w-4" />
                    Recent Meals
                  </h4>
                  {foodEntries.length > 0 ? (
                    <div className="space-y-2">
                      {foodEntries.slice(0, 3).map((entry: any) => (
                        <div key={entry.id} className="p-3 border rounded-lg text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {entry.mealType}
                              </Badge>
                              <span className="font-medium">{entry.description}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString('en-US', { 
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {entry.quantity && (
                            <p className="text-xs text-muted-foreground">
                              Quantity: {entry.quantity}g
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No recent meals recorded</p>
                  )}
                </div>

                {/* Recent Cardio Activities */}
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Cardio
                  </h4>
                  {cardioActivities.length > 0 ? (
                    <div className="space-y-2">
                      {cardioActivities.slice(0, 3).map((activity: any) => (
                        <div key={activity.id} className="p-3 border rounded-lg text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {activity.activityType}
                              </Badge>
                              <span className="font-medium">
                                {activity.duration} min
                                {activity.distance && ` • ${activity.distance} km`}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.date).toLocaleDateString('en-US', { 
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          {activity.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No recent cardio activities recorded</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('clientDetail.clientActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.user?.status === 'active' ? (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  onClick={() => suspendMutation.mutate()}
                  disabled={suspendMutation.isPending}
                >
                  {suspendMutation.isPending ? t('clientDetail.suspending') : t('clientDetail.suspendClient')}
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  onClick={() => reactivateMutation.mutate()}
                  disabled={reactivateMutation.isPending}
                >
                  {reactivateMutation.isPending ? 'Reactivating...' : 'Reactivate Client'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Dialog */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-4xl h-[600px] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t('clientDetail.chatWith', { name: getUserDisplayName() })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden h-[calc(600px-100px)]">
            <Chat targetUserId={client.userId} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Plan Modal */}
      <Dialog open={showAssignPlanModal} onOpenChange={setShowAssignPlanModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {planAssignmentType === 'training' && 'Assign Training Plan'}
              {planAssignmentType === 'meal' && 'Assign Meal Plan'}
              {planAssignmentType === 'supplement' && 'Assign Supplement Plan'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Client: <span className="font-medium">{getUserDisplayName()}</span>
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const planId = formData.get("planId") as string;
              const startDate = formData.get("startDate") as string;
              
              if (!planId) {
                toast({
                  title: "Error",
                  description: `Please select a ${planAssignmentType} plan`,
                  variant: "destructive",
                });
                return;
              }

              if (planAssignmentType === 'training') {
                // Training plan assignment logic
                const selectedPlan = availablePlans.find((plan: any) => plan.id === planId);
                if (!selectedPlan) {
                  toast({
                    title: "Error",
                    description: "Selected plan not found",
                    variant: "destructive",
                  });
                  return;
                }

                const start = new Date(startDate);
                const end = new Date(start);
                end.setDate(start.getDate() + (selectedPlan.duration * 7));

                assignPlanMutation.mutate({
                  planId,
                  startDate,
                  endDate: end.toISOString().split('T')[0],
                });
              } else if (planAssignmentType === 'meal') {
                // Meal plan assignment logic
                assignMealPlanMutation.mutate({
                  mealPlanId: planId,
                  clientId: clientId!,
                  startDate,
                  isActive: true,
                });
              } else if (planAssignmentType === 'supplement') {
                // Supplement plan assignment logic
                assignSupplementPlanMutation.mutate({
                  supplementPlanId: planId,
                  clientId: clientId!,
                  trainerId: client?.trainerId!,
                  startDate,
                  isActive: true,
                });
              }
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="planId">
                  {planAssignmentType === 'training' && 'Select Training Plan'}
                  {planAssignmentType === 'meal' && 'Select Meal Plan'}
                  {planAssignmentType === 'supplement' && 'Select Supplement Plan'}
                </Label>
                <Select name="planId" required>
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose a ${planAssignmentType} plan`} />
                  </SelectTrigger>
                  <SelectContent>
                    {planAssignmentType === 'training' && Array.isArray(availablePlans) && availablePlans.length > 0 ? (
                      availablePlans.map((plan: any) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} ({plan.duration} weeks)
                        </SelectItem>
                      ))
                    ) : planAssignmentType === 'meal' && Array.isArray(availableMealPlans) && availableMealPlans.length > 0 ? (
                      availableMealPlans.map((plan: any) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))
                    ) : planAssignmentType === 'supplement' && Array.isArray(availableSupplementPlans) && availableSupplementPlans.length > 0 ? (
                      availableSupplementPlans.map((plan: any) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-plans" disabled>
                        No {planAssignmentType} plans available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  name="startDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAssignPlanModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assignPlanMutation.isPending || assignMealPlanMutation.isPending || assignSupplementPlanMutation.isPending}
              >
                {(assignPlanMutation.isPending || assignMealPlanMutation.isPending || assignSupplementPlanMutation.isPending) 
                  ? t('clientDetail.assigning') 
                  : t('clientDetail.assignPlan')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Calorie Goal Modal */}
      <Dialog open={showCalorieGoalModal} onOpenChange={setShowCalorieGoalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Calorie Goal</DialogTitle>
          </DialogHeader>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Client: <span className="font-medium">{getUserDisplayName()}</span>
            </p>
            {clientCalorieGoal?.goal && (
              <p className="text-sm text-gray-600">
                Current Goal: <span className="font-medium">{clientCalorieGoal.goal} calories/day</span>
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const goal = parseInt(newCalorieGoal);
              
              if (!goal || goal <= 0 || goal > 10000) {
                toast({
                  title: "Error",
                  description: "Please enter a valid calorie goal between 1 and 10,000",
                  variant: "destructive",
                });
                return;
              }

              updateCalorieGoalMutation.mutate(goal);
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="calorieGoal">Daily Calorie Goal</Label>
                <Input
                  type="number"
                  id="calorieGoal"
                  value={newCalorieGoal}
                  onChange={(e) => setNewCalorieGoal(e.target.value)}
                  placeholder={clientCalorieGoal?.goal?.toString() || "2000"}
                  min="1"
                  max="10000"
                  required
                  data-testid="input-calorie-goal"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended range: 1,200 - 3,500 calories per day
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCalorieGoalModal(false);
                  setNewCalorieGoal("");
                }}
                data-testid="button-cancel-goal"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateCalorieGoalMutation.isPending}
                data-testid="button-save-goal"
              >
                {updateCalorieGoalMutation.isPending ? "Updating..." : "Update Goal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}