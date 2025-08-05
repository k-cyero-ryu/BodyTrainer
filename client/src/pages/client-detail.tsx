import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  X
} from "lucide-react";

const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const formatBillingCycle = (type: string) => {
  switch (type) {
    case "monthly":
      return "Monthly";
    case "weekly":
      return "Weekly";
    case "per_session":
      return "Per Session";
    default:
      return type;
  }
};

export default function ClientDetail() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [match, params] = useRoute("/clients/:clientId");
  const clientId = params?.clientId;
  const [showChat, setShowChat] = useState(false);

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
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  const { data: trainingPlans = [] } = useQuery({
    queryKey: ["/api/training-plans", { clientId }],
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ["/api/evaluations", { clientId }],
    enabled: !!clientId && !!user && user.role === 'trainer',
  });

  // Load client payment plan details if client has one assigned
  const { data: clientPaymentPlan } = useQuery({
    queryKey: [`/api/client-payment-plans/${client?.clientPaymentPlanId}`],
    enabled: !!client?.clientPaymentPlanId && !!user && user.role === 'trainer',
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
                Back to Clients
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
              Back to Clients
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowChat(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Link href={`/clients/${clientId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
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
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.user?.email}</span>
              </div>
              {client.age && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.age} years old</span>
                </div>
              )}
              {client.height && (
                <div className="flex items-center gap-3">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.height} cm</span>
                </div>
              )}
              {client.weight && (
                <div className="flex items-center gap-3">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.weight} kg</span>
                </div>
              )}
              {client.bodyGoal && (
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Goal</p>
                    <p className="text-sm text-muted-foreground">{client.bodyGoal}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getPaymentStatusColor(client.paymentStatus || 'inactive')}>
                  {client.paymentStatus || 'inactive'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Plan</span>
                {clientPaymentPlan ? (
                  <div className="text-right">
                    <div className="text-sm font-medium">{clientPaymentPlan.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(clientPaymentPlan.amount, clientPaymentPlan.currency)} ({formatBillingCycle(clientPaymentPlan.type)})
                    </div>
                  </div>
                ) : (
                  <span className="text-sm">None</span>
                )}
              </div>
              {client.referralSource && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Referral</span>
                  <span className="text-sm">{client.referralSource}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
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
                  {suspendMutation.isPending ? 'Suspending...' : 'Suspend Client'}
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

        {/* Right Column - Training Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Training Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Training Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trainingPlans.length > 0 ? (
                <div className="space-y-3">
                  {trainingPlans.map((plan: any) => (
                    <div key={plan.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{plan.name}</h3>
                        <Badge variant="secondary">{plan.difficulty}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {plan.duration} weeks
                        </span>
                        <span>{plan.exercises?.length || 0} exercises</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No training plans assigned yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Evaluations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Evaluations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluations.length > 0 ? (
                <div className="space-y-4">
                  {evaluations.slice(0, 3).map((evaluation: any) => (
                    <div key={evaluation.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">
                          {new Date(evaluation.month).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </h3>
                        <Badge variant="outline">Score: {evaluation.overallScore}/10</Badge>
                      </div>
                      {evaluation.notes && (
                        <p className="text-sm text-muted-foreground">{evaluation.notes}</p>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="font-medium">Progress: </span>
                          <span>{evaluation.progressScore}/10</span>
                        </div>
                        <div>
                          <span className="font-medium">Consistency: </span>
                          <span>{evaluation.consistencyScore}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No evaluations recorded yet.</p>
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
                Chat with {getUserDisplayName()}
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
    </div>
  );
}