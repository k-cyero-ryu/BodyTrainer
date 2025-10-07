import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
// import { Textarea } from "@/components/ui/textarea";
import { Users, Dumbbell, Search, ChevronDown, ChevronUp } from "lucide-react";

export default function ClientRegistration() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showTrainerBrowser, setShowTrainerBrowser] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTrainerId, setExpandedTrainerId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    referralCode: "",
    goals: "",
    currentWeight: "",
    targetWeight: "",
    height: "",
    activityLevel: "moderate",
    medicalConditions: "",
  });

  // Fetch all trainers for browsing
  const { data: trainers = [], isLoading: trainersLoading } = useQuery({
    queryKey: ['/api/trainers/browse'],
    enabled: showTrainerBrowser,
  });

  useEffect(() => {
    // Extract referral code from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setFormData(prev => ({ ...prev, referralCode: code }));
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to register as a client",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/clients/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "You have been successfully registered as a client",
      });
      navigate("/client/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register as client",
        variant: "destructive",
      });
    },
  });

  // Filter trainers based on search query
  const filteredTrainers = trainers.filter((trainer: any) => {
    const fullName = `${trainer.firstName || ''} ${trainer.lastName || ''}`.toLowerCase();
    const code = trainer.referralCode?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || code.includes(query);
  });

  const handleSelectTrainer = (trainer: any) => {
    setFormData(prev => ({ ...prev, referralCode: trainer.referralCode }));
    setShowTrainerBrowser(false);
    toast({
      title: "Trainer Selected",
      description: `${trainer.firstName} ${trainer.lastName} has been selected as your trainer`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.referralCode) {
      toast({
        title: "Error",
        description: "Referral code is required",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      referralCode: formData.referralCode,
      goals: formData.goals,
      currentWeight: formData.currentWeight ? Number(formData.currentWeight) : null,
      targetWeight: formData.targetWeight ? Number(formData.targetWeight) : null,
      height: formData.height ? Number(formData.height) : null,
      activityLevel: formData.activityLevel,
      medicalConditions: formData.medicalConditions,
    };

    registerMutation.mutate(submitData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Dumbbell className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Client Registration</h1>
          <p className="text-gray-600 mt-2">Complete your profile to start your fitness journey</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="referralCode">Trainer Referral Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="referralCode"
                    placeholder="Enter your trainer's referral code"
                    value={formData.referralCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value }))}
                    required
                    data-testid="input-referral-code"
                  />
                  <Dialog open={showTrainerBrowser} onOpenChange={setShowTrainerBrowser}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" data-testid="button-browse-trainers">
                        <Search className="h-4 w-4 mr-2" />
                        Browse Trainers
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Select Your Trainer</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by name or referral code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            data-testid="input-trainer-search"
                          />
                        </div>
                        <ScrollArea className="h-[400px] pr-4">
                          {trainersLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          ) : filteredTrainers.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No trainers found</p>
                          ) : (
                            <div className="space-y-3">
                              {filteredTrainers.map((trainer: any) => (
                                <Collapsible
                                  key={trainer.id}
                                  open={expandedTrainerId === trainer.id}
                                  onOpenChange={(open) => setExpandedTrainerId(open ? trainer.id : null)}
                                >
                                  <Card className="border-2 hover:border-primary/50 transition-colors">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <h3 className="font-semibold text-lg" data-testid={`trainer-name-${trainer.id}`}>
                                            {trainer.firstName} {trainer.lastName}
                                          </h3>
                                          <p className="text-sm text-gray-600" data-testid={`trainer-code-${trainer.id}`}>
                                            Referral Code: <span className="font-mono font-semibold">{trainer.referralCode}</span>
                                          </p>
                                          {trainer.expertise && (
                                            <p className="text-sm text-gray-500 mt-1">{trainer.expertise}</p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            type="button"
                                            onClick={() => handleSelectTrainer(trainer)}
                                            size="sm"
                                            data-testid={`button-select-${trainer.id}`}
                                          >
                                            Select
                                          </Button>
                                          <CollapsibleTrigger asChild>
                                            <Button type="button" variant="ghost" size="sm" data-testid={`button-expand-${trainer.id}`}>
                                              {expandedTrainerId === trainer.id ? (
                                                <ChevronUp className="h-4 w-4" />
                                              ) : (
                                                <ChevronDown className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </CollapsibleTrigger>
                                        </div>
                                      </div>
                                      <CollapsibleContent className="mt-4 pt-4 border-t space-y-3">
                                        {trainer.bio && (
                                          <div>
                                            <p className="text-sm font-medium text-gray-700">About</p>
                                            <p className="text-sm text-gray-600 mt-1">{trainer.bio}</p>
                                          </div>
                                        )}
                                        {trainer.certifications && trainer.certifications.length > 0 && (
                                          <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Certifications</p>
                                            <div className="space-y-2">
                                              {trainer.certifications.map((cert: any, index: number) => (
                                                <div key={index} className="bg-gray-50 p-2 rounded" data-testid={`cert-${trainer.id}-${index}`}>
                                                  <p className="font-medium text-sm">{cert.name}</p>
                                                  {cert.issuer && <p className="text-xs text-gray-600">{cert.issuer}</p>}
                                                  {cert.year && <p className="text-xs text-gray-500">{cert.year}</p>}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {trainer.specializations && trainer.specializations.length > 0 && (
                                          <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Specializations</p>
                                            <div className="flex flex-wrap gap-2">
                                              {trainer.specializations.map((spec: string, index: number) => (
                                                <Badge key={index} variant="secondary" data-testid={`spec-${trainer.id}-${index}`}>
                                                  {spec}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </CollapsibleContent>
                                    </CardContent>
                                  </Card>
                                </Collapsible>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-gray-500">
                  Enter the code provided by your trainer or browse available trainers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Fitness Goals *</Label>
                <textarea
                  id="goals"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe your fitness goals (e.g., lose weight, build muscle, improve endurance)"
                  value={formData.goals}
                  onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentWeight">Current Weight (kg)</Label>
                  <Input
                    id="currentWeight"
                    type="number"
                    placeholder="70"
                    value={formData.currentWeight}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentWeight: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    placeholder="65"
                    value={formData.targetWeight}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetWeight: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityLevel">Activity Level</Label>
                <Select 
                  value={formData.activityLevel} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, activityLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                    <SelectItem value="light">Light (light exercise 1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (hard exercise 6-7 days/week)</SelectItem>
                    <SelectItem value="very_active">Very Active (very hard exercise, physical job)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalConditions">Medical Conditions</Label>
                <textarea
                  id="medicalConditions"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Any medical conditions, injuries, or limitations we should know about (optional)"
                  value={formData.medicalConditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicalConditions: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registering...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}