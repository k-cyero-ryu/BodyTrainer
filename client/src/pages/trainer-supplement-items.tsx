import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplementItemSchema, type SupplementItem } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Pill, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const supplementItemFormSchema = insertSupplementItemSchema.omit({ 
  id: true, 
  trainerId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  defaultDosage: z.string().min(1, "Dosage is required"),
});

type SupplementItemFormData = z.infer<typeof supplementItemFormSchema>;

export default function TrainerSupplementItems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplementItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<SupplementItemFormData>({
    resolver: zodResolver(supplementItemFormSchema),
    defaultValues: {
      name: "",
      brand: "",
      defaultDosage: "",
      defaultFrequency: "",
      defaultTiming: "",
      purpose: "",
      instructions: "",
    },
  });

  const editForm = useForm<SupplementItemFormData>({
    resolver: zodResolver(supplementItemFormSchema),
    defaultValues: {
      name: "",
      brand: "",
      defaultDosage: "",
      defaultFrequency: "",
      defaultTiming: "",
      purpose: "",
      instructions: "",
    },
  });

  const { data: supplementItems = [], isLoading } = useQuery<SupplementItem[]>({
    queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-items`],
    enabled: !!user?.trainer?.id,
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: SupplementItemFormData) => {
      return await apiRequest("POST", "/api/nutrition/supplement-items", {
        ...data,
        trainerId: user?.trainer?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-items`] });
      toast({
        title: t("Success"),
        description: "Supplement item created successfully",
      });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("Error"),
        description: error.message || "Failed to create supplement item",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<SupplementItemFormData> }) => {
      return await apiRequest("PATCH", `/api/nutrition/supplement-items/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-items`] });
      toast({
        title: t("Success"),
        description: "Supplement item updated successfully",
      });
      setShowEditDialog(false);
      setEditingItem(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("Error"),
        description: error.message || "Failed to update supplement item",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/nutrition/supplement-items/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/nutrition/trainers/${user?.trainer?.id}/supplement-items`] });
      toast({
        title: t("Success"),
        description: "Supplement item deleted successfully",
      });
      setDeletingItemId(null);
    },
    onError: (error: any) => {
      toast({
        title: t("Error"),
        description: error.message || "Failed to delete supplement item",
        variant: "destructive",
      });
      setDeletingItemId(null);
    },
  });

  const handleCreate = (data: SupplementItemFormData) => {
    createItemMutation.mutate(data);
  };

  const handleEdit = (item: SupplementItem) => {
    setEditingItem(item);
    editForm.reset({
      name: item.name,
      brand: item.brand || "",
      defaultDosage: item.defaultDosage || "",
      defaultFrequency: item.defaultFrequency || "",
      defaultTiming: item.defaultTiming || "",
      purpose: item.purpose || "",
      instructions: item.instructions || "",
    });
    setShowEditDialog(true);
  };

  const handleUpdate = (data: SupplementItemFormData) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, updates: data });
    }
  };

  const handleDelete = (id: string) => {
    deleteItemMutation.mutate(id);
  };

  const filteredItems = supplementItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-supplement-items">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Supplement Items Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage your reusable supplement items to use in supplement plans
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-item">
              <Plus className="w-4 h-4 mr-2" />
              Add Supplement Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">Create Supplement Item</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Whey Protein"
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Optimum Nutrition"
                          data-testid="input-brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultDosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 30g, 2 capsules, 1 scoop"
                          data-testid="input-dosage"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Muscle recovery, Energy boost"
                          data-testid="input-purpose"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any specific instructions for this supplement..."
                          rows={3}
                          data-testid="input-instructions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createItemMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createItemMutation.isPending ? "Creating..." : "Create Item"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search supplement items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading supplement items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Pill className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No supplement items match your search"
                  : "No supplement items yet. Create your first one to get started!"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} data-testid={`card-supplement-${item.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg" data-testid={`text-name-${item.id}`}>
                      {item.name}
                    </CardTitle>
                    {item.brand && (
                      <CardDescription data-testid={`text-brand-${item.id}`}>
                        {item.brand}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-${item.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingItemId(item.id)}
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Dosage: </span>
                    <span className="text-sm text-muted-foreground" data-testid={`text-dosage-${item.id}`}>
                      {item.defaultDosage}
                    </span>
                  </div>
                  {item.purpose && (
                    <div>
                      <span className="text-sm font-medium">Purpose: </span>
                      <span className="text-sm text-muted-foreground" data-testid={`text-purpose-${item.id}`}>
                        {item.purpose}
                      </span>
                    </div>
                  )}
                  {item.instructions && (
                    <div>
                      <span className="text-sm font-medium">Instructions: </span>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-instructions-${item.id}`}>
                        {item.instructions}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Supplement Item</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Whey Protein" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Optimum Nutrition" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="defaultDosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 30g, 2 capsules, 1 scoop" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Muscle recovery, Energy boost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Any specific instructions for this supplement..." rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingItem(null);
                    editForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateItemMutation.isPending}>
                  {updateItemMutation.isPending ? "Updating..." : "Update Item"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplement Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this supplement item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItemId && handleDelete(deletingItemId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
