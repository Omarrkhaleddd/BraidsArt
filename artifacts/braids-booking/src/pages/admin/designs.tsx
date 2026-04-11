import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { AdminGuard } from "@/components/admin-guard";
import { 
  useListDesigns, 
  useCreateDesign, 
  useUpdateDesign, 
  useDeleteDesign,
  getListDesignsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Scissors, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader } from "@/components/image-uploader";

const designSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  durationHours: z.coerce.number().min(0.5, "Duration must be at least 0.5 hours"),
  imageUrl: z.string().optional(),
  description: z.string().optional()
});

type DesignFormValues = z.infer<typeof designSchema>;

export default function AdminDesigns() {
  const { data: designs, isLoading } = useListDesigns();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const createDesign = useCreateDesign();
  const updateDesign = useUpdateDesign();
  const deleteDesign = useDeleteDesign();

  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designSchema),
    defaultValues: {
      name: "",
      price: 0,
      durationHours: 1,
      imageUrl: "",
      description: ""
    }
  });

  const openCreateForm = () => {
    setEditingId(null);
    form.reset({
      name: "",
      price: 0,
      durationHours: 1,
      imageUrl: "",
      description: ""
    });
    setIsFormOpen(true);
  };

  const openEditForm = (design: any) => {
    setEditingId(design.id);
    form.reset({
      name: design.name,
      price: design.price,
      durationHours: design.durationHours,
      imageUrl: design.imageUrl || "",
      description: design.description || ""
    });
    setIsFormOpen(true);
  };

  const onSubmit = (values: DesignFormValues) => {
    const payload = {
      ...values,
      imageUrl: values.imageUrl || undefined,
      description: values.description || undefined
    };

    if (editingId) {
      updateDesign.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDesignsQueryKey() });
            setIsFormOpen(false);
            toast({ title: "Design updated successfully" });
          },
          onError: () => toast({ title: "Failed to update design", variant: "destructive" })
        }
      );
    } else {
      createDesign.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDesignsQueryKey() });
            setIsFormOpen(false);
            toast({ title: "Design created successfully" });
          },
          onError: () => toast({ title: "Failed to create design", variant: "destructive" })
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    deleteDesign.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDesignsQueryKey() });
          toast({ title: "Design deleted" });
        },
        onError: () => toast({ title: "Failed to delete design", variant: "destructive" })
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Designs</h1>
            <p className="text-muted-foreground mt-1">Manage the braiding styles offered in the app.</p>
          </div>
          
          <Button onClick={openCreateForm} className="rounded-full gap-2">
            <Plus className="h-4 w-4" /> Add Design
          </Button>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingId ? "Edit Design" : "Add New Design"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Design Image</FormLabel>
                      <FormControl>
                        <ImageUploader
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Knotless Box Braids" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="durationHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Hours)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the style..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-2 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createDesign.isPending || updateDesign.isPending}>
                    {editingId ? "Save Changes" : "Create Design"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[300px] rounded-xl" />)}
          </div>
        ) : designs && designs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {designs.map(design => (
              <Card key={design.id} className="overflow-hidden border-border/50 group shadow-sm flex flex-col">
                <div className="h-48 bg-muted relative border-b border-border/50">
                  {design.imageUrl ? (
                    <img src={design.imageUrl} alt={design.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                      <span className="text-sm font-medium">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8 rounded-full shadow-sm bg-background/80 backdrop-blur hover:bg-background"
                      onClick={() => openEditForm(design)}
                    >
                      <Pencil className="h-4 w-4 text-foreground" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="h-8 w-8 rounded-full shadow-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Design?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{design.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(design.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <h3 className="font-serif font-bold text-lg leading-tight mb-1">{design.name}</h3>
                  <div className="flex items-center text-sm font-medium text-primary mb-3">
                    ${design.price} &bull; {design.durationHours} hours
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">
                    {design.description || "No description provided."}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-dashed">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Scissors className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No designs yet</h3>
            <p className="text-muted-foreground mb-6">Add your first braiding style to start taking bookings.</p>
            <Button onClick={openCreateForm} variant="outline" className="rounded-full">Add a Design</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
