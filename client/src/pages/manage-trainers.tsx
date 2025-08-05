import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  MessageCircle, 
  Eye,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Chat from "@/components/chat";

export default function ManageTrainers() {
  const { toast } = useToast();
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch pending trainers
  const { data: pendingTrainers = [], isLoading: loadingPending } = useQuery<any[]>({
    queryKey: ['/api/admin/pending-trainers'],
  });

  // Fetch approved trainers
  const { data: approvedTrainers = [], isLoading: loadingApproved } = useQuery<any[]>({
    queryKey: ['/api/admin/approved-trainers'],
  });

  // Approve trainer mutation
  const approveMutation = useMutation({
    mutationFn: async (trainerId: string) => {
      return await apiRequest(`/api/admin/approve-trainer/${trainerId}`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-trainers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/approved-trainers'] });
      toast({
        title: "Trainer Approved",
        description: "The trainer has been successfully approved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve trainer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject trainer mutation
  const rejectMutation = useMutation({
    mutationFn: async (trainerId: string) => {
      return await apiRequest(`/api/admin/reject-trainer/${trainerId}`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-trainers'] });
      toast({
        title: "Trainer Rejected",
        description: "The trainer application has been rejected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject trainer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Suspend trainer mutation
  const suspendMutation = useMutation({
    mutationFn: async (trainerId: string) => {
      return await apiRequest(`/api/admin/suspend-trainer/${trainerId}`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/approved-trainers'] });
      toast({
        title: "Trainer Suspended",
        description: "The trainer has been suspended.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to suspend trainer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getUserInitials = (user: any) => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'T';
  };

  const getUserDisplayName = (user: any) => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.email || 'Unknown User';
  };

  const TrainerCard = ({ trainer, isPending = false }: { trainer: any; isPending?: boolean }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={trainer.profileImageUrl} />
              <AvatarFallback>{getUserInitials(trainer)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{getUserDisplayName(trainer)}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {trainer.email}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isPending ? "secondary" : "default"}>
              {isPending ? "Pending" : "Approved"}
            </Badge>
            {isPending && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Awaiting Review
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            {trainer.referralCode && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Referral Code:</strong> {trainer.referralCode}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4 inline mr-1" />
              <strong>Joined:</strong> {new Date(trainer.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Status:</strong> {trainer.status || 'Active'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4 inline mr-1" />
              <strong>Role:</strong> {trainer.role}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedTrainerId(trainer.id);
              setIsChatOpen(true);
            }}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Chat
          </Button>

          {isPending && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="default">
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Trainer</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve {getUserDisplayName(trainer)}? 
                      They will gain access to the trainer features and be able to accept clients.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => approveMutation.mutate(trainer.id)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? "Approving..." : "Approve"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Trainer Application</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject {getUserDisplayName(trainer)}'s application? 
                      This action cannot be undone and they will need to reapply.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => rejectMutation.mutate(trainer.id)}
                      disabled={rejectMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {!isPending && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <UserX className="h-4 w-4 mr-1" />
                  Suspend
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suspend Trainer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to suspend {getUserDisplayName(trainer)}? 
                    They will lose access to trainer features until reactivated.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => suspendMutation.mutate(trainer.id)}
                    disabled={suspendMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {suspendMutation.isPending ? "Suspending..." : "Suspend"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Trainers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review, approve, and manage trainer applications and accounts
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Approval ({pendingTrainers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Approved Trainers ({approvedTrainers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Trainer Applications</CardTitle>
              <CardDescription>
                Review and approve new trainer applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded"></div>
                  ))}
                </div>
              ) : pendingTrainers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending trainer applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTrainers.map((trainer: any) => (
                    <TrainerCard key={trainer.id} trainer={trainer} isPending={true} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Approved Trainers</CardTitle>
              <CardDescription>
                Manage approved trainer accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingApproved ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded"></div>
                  ))}
                </div>
              ) : approvedTrainers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No approved trainers yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedTrainers.map((trainer: any) => (
                    <TrainerCard key={trainer.id} trainer={trainer} isPending={false} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat with Trainer
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <Chat />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}