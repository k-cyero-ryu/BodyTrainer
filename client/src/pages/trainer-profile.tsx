import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Edit, Save, X, Plus, Trash2, MapPin, Phone, Mail, Globe, Instagram, Facebook, Twitter, Linkedin } from "lucide-react";

// Trainer profile update schema
const trainerProfileSchema = z.object({
  expertise: z.string().optional(),
  experience: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string().optional(),
    year: z.string().optional(),
  })).optional(),
  specializations: z.array(z.string()).optional(),
  socialMedia: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
});

// User profile update schema
const userProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
});

type TrainerProfileData = z.infer<typeof trainerProfileSchema>;
type UserProfileData = z.infer<typeof userProfileSchema>;

export default function TrainerProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [certificationDialog, setCertificationDialog] = useState(false);
  const [newCertification, setNewCertification] = useState({ name: "", issuer: "", year: "" });
  const [newSpecialization, setNewSpecialization] = useState("");

  // Fetch trainer profile data using the working clients endpoint
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["/api/trainers/clients"],
    enabled: !!user && user.role === 'trainer',
  });

  // Extract profile information from the API response
  const trainerProfile = clientsData || {};
  const referralCode = clientsData?.referralCode;

  // Form for trainer profile
  const trainerForm = useForm<TrainerProfileData>({
    resolver: zodResolver(trainerProfileSchema),
    defaultValues: {
      expertise: "",
      experience: "",
      bio: "",
      phone: "",
      location: "",
      address: "",
      website: "",
      certifications: [],
      specializations: [],
      socialMedia: {},
    },
  });

  // Reset form values when data loads or when entering edit mode
  React.useEffect(() => {
    if (clientsData && isEditing) {
      trainerForm.reset({
        expertise: (clientsData as any)?.expertise || "",
        experience: (clientsData as any)?.experience || "",
        bio: (clientsData as any)?.bio || "",
        phone: (clientsData as any)?.phone || "",
        location: (clientsData as any)?.location || "",
        address: (clientsData as any)?.address || "",
        website: (clientsData as any)?.website || "",
        certifications: (clientsData as any)?.certifications || [],
        specializations: (clientsData as any)?.specializations || [],
        socialMedia: (clientsData as any)?.socialMedia || {},
      });
    }
  }, [clientsData, isEditing, trainerForm]);

  // Form for user profile
  const userForm = useForm<UserProfileData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  // Reset user form when entering edit mode
  React.useEffect(() => {
    if (user && isEditing) {
      userForm.reset({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
      });
    }
  }, [user, isEditing, userForm]);

  // Update trainer profile mutation
  const updateTrainerMutation = useMutation({
    mutationFn: async (data: TrainerProfileData) => {
      return await apiRequest('PUT', '/api/trainers/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainers/clients"] });
      toast({
        title: "Profile Updated",
        description: "Your trainer profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user profile mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserProfileData) => {
      return await apiRequest('PUT', '/api/auth/user/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trainers/clients"] });
      toast({
        title: "Personal Info Updated",
        description: "Your personal information has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    Promise.all([
      trainerForm.handleSubmit((data) => updateTrainerMutation.mutate(data))(),
      userForm.handleSubmit((data) => updateUserMutation.mutate(data))(),
    ]);
  };

  const addCertification = () => {
    if (newCertification.name.trim()) {
      const currentCerts = trainerForm.getValues("certifications") || [];
      trainerForm.setValue("certifications", [...currentCerts, newCertification]);
      setNewCertification({ name: "", issuer: "", year: "" });
      setCertificationDialog(false);
    }
  };

  const removeCertification = (index: number) => {
    const currentCerts = trainerForm.getValues("certifications") || [];
    trainerForm.setValue("certifications", currentCerts.filter((_, i) => i !== index));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim()) {
      const currentSpecs = trainerForm.getValues("specializations") || [];
      trainerForm.setValue("specializations", [...currentSpecs, newSpecialization]);
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (index: number) => {
    const currentSpecs = trainerForm.getValues("specializations") || [];
    trainerForm.setValue("specializations", currentSpecs.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-profile-title">Trainer Profile</h1>
          <p className="text-gray-600 mt-2">Manage your professional information and credentials</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                data-testid="button-cancel-edit"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateTrainerMutation.isPending || updateUserMutation.isPending}
                data-testid="button-save-profile"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)}
              data-testid="button-edit-profile"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <Form {...userForm}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">First Name</p>
                    <p className="font-medium" data-testid="text-first-name">{user?.firstName || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Name</p>
                    <p className="font-medium" data-testid="text-last-name">{user?.lastName || "Not set"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium flex items-center gap-2" data-testid="text-email">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <Form {...trainerForm}>
                  <div className="space-y-4">
                    <FormField
                      control={trainerForm.control}
                      name="expertise"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expertise</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Weight Loss, Muscle Building" data-testid="input-expertise" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trainerForm.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 5 years" data-testid="input-experience" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trainerForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Tell clients about your background, approach, and what makes you unique as a trainer..."
                              rows={4}
                              data-testid="input-bio"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Expertise</p>
                    <p className="font-medium" data-testid="text-expertise">{(trainerProfile as any)?.expertise || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="font-medium" data-testid="text-experience">{(trainerProfile as any)?.experience || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bio</p>
                    <p className="text-gray-900" data-testid="text-bio">{(trainerProfile as any)?.bio || "No bio provided"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <Form {...trainerForm}>
                  <div className="space-y-4">
                    <FormField
                      control={trainerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+1 (555) 123-4567" data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trainerForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City/Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="New York, NY" data-testid="input-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trainerForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Studio address or gym location" rows={2} data-testid="input-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trainerForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://yourwebsite.com" data-testid="input-website" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium flex items-center gap-2" data-testid="text-phone">
                      <Phone className="h-4 w-4" />
                      {(trainerProfile as any)?.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium flex items-center gap-2" data-testid="text-location">
                      <MapPin className="h-4 w-4" />
                      {(trainerProfile as any)?.location || "Not specified"}
                    </p>
                  </div>
                  {(trainerProfile as any)?.address && (
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium" data-testid="text-address">{(trainerProfile as any)?.address}</p>
                    </div>
                  )}
                  {(trainerProfile as any)?.website && (
                    <div>
                      <p className="text-sm text-gray-600">Website</p>
                      <a 
                        href={(trainerProfile as any)?.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-2"
                        data-testid="link-website"
                      >
                        <Globe className="h-4 w-4" />
                        {(trainerProfile as any)?.website}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Referral Code */}
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Share this code with new clients:</p>
                <p className="text-2xl font-bold text-primary" data-testid="text-referral-code">{referralCode || 'Loading...'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Certifications
                {isEditing && (
                  <Dialog open={certificationDialog} onOpenChange={setCertificationDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" data-testid="button-add-certification">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Certification</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Certification Name"
                          value={newCertification.name}
                          onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                          data-testid="input-cert-name"
                        />
                        <Input
                          placeholder="Issuing Organization"
                          value={newCertification.issuer}
                          onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
                          data-testid="input-cert-issuer"
                        />
                        <Input
                          placeholder="Year"
                          value={newCertification.year}
                          onChange={(e) => setNewCertification(prev => ({ ...prev, year: e.target.value }))}
                          data-testid="input-cert-year"
                        />
                        <Button onClick={addCertification} className="w-full" data-testid="button-save-certification">
                          Add Certification
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(trainerForm.watch("certifications") || []).map((cert, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded" data-testid={`cert-item-${index}`}>
                    <div>
                      <p className="font-medium">{cert.name}</p>
                      {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
                      {cert.year && <p className="text-xs text-gray-500">{cert.year}</p>}
                    </div>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCertification(index)}
                        data-testid={`button-remove-cert-${index}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
                {(!trainerForm.watch("certifications") || trainerForm.watch("certifications")?.length === 0) && (
                  <p className="text-gray-500 text-sm" data-testid="text-no-certifications">No certifications added</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Specializations */}
          <Card>
            <CardHeader>
              <CardTitle>Specializations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add specialization"
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                      data-testid="input-new-specialization"
                    />
                    <Button onClick={addSpecialization} size="sm" data-testid="button-add-specialization">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {(trainerForm.watch("specializations") || []).map((spec, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1" data-testid={`specialization-${index}`}>
                      {spec}
                      {isEditing && (
                        <button
                          onClick={() => removeSpecialization(index)}
                          className="ml-1"
                          data-testid={`button-remove-spec-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {(!trainerForm.watch("specializations") || trainerForm.watch("specializations")?.length === 0) && (
                  <p className="text-gray-500 text-sm" data-testid="text-no-specializations">No specializations added</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...trainerForm}>
                  <div className="space-y-3">
                    <FormField
                      control={trainerForm.control}
                      name="socialMedia.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Instagram className="h-4 w-4 text-pink-500" />
                              <Input {...field} placeholder="Instagram username" data-testid="input-instagram" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trainerForm.control}
                      name="socialMedia.facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Facebook className="h-4 w-4 text-blue-600" />
                              <Input {...field} placeholder="Facebook profile" data-testid="input-facebook" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trainerForm.control}
                      name="socialMedia.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Twitter className="h-4 w-4 text-blue-400" />
                              <Input {...field} placeholder="Twitter handle" data-testid="input-twitter" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trainerForm.control}
                      name="socialMedia.linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Linkedin className="h-4 w-4 text-blue-700" />
                              <Input {...field} placeholder="LinkedIn profile" data-testid="input-linkedin" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              ) : (
                <div className="space-y-2">
                  {(trainerProfile as any)?.socialMedia?.instagram && (
                    <a 
                      href={`https://instagram.com/${(trainerProfile as any)?.socialMedia?.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-pink-500"
                      data-testid="link-instagram"
                    >
                      <Instagram className="h-4 w-4" />
                      @{(trainerProfile as any)?.socialMedia?.instagram}
                    </a>
                  )}
                  {(trainerProfile as any)?.socialMedia?.facebook && (
                    <a 
                      href={(trainerProfile as any)?.socialMedia?.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-blue-600"
                      data-testid="link-facebook"
                    >
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </a>
                  )}
                  {(trainerProfile as any)?.socialMedia?.twitter && (
                    <a 
                      href={`https://twitter.com/${(trainerProfile as any)?.socialMedia?.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-blue-400"
                      data-testid="link-twitter"
                    >
                      <Twitter className="h-4 w-4" />
                      @{(trainerProfile as any)?.socialMedia?.twitter}
                    </a>
                  )}
                  {(trainerProfile as any)?.socialMedia?.linkedin && (
                    <a 
                      href={(trainerProfile as any)?.socialMedia?.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-blue-700"
                      data-testid="link-linkedin"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {(!(trainerProfile as any)?.socialMedia || Object.keys((trainerProfile as any)?.socialMedia || {}).length === 0) && (
                    <p className="text-gray-500 text-sm" data-testid="text-no-social">No social media links added</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}