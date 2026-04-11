import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { 
  useListAvailability, 
  useCreateAvailability, 
  useDeleteAvailability,
  getListAvailabilityQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Trash2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const availabilitySchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:MM (24h)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:MM (24h)"),
}).refine(data => {
  return data.startTime < data.endTime;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

export default function AdminAvailability() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  
  const { data: availability, isLoading } = useListAvailability({ date: dateStr });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createAvailability = useCreateAvailability();
  const deleteAvailability = useDeleteAvailability();

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      startTime: "09:00",
      endTime: "17:00",
    }
  });

  const onSubmit = (values: AvailabilityFormValues) => {
    createAvailability.mutate(
      { 
        data: {
          date: dateStr,
          startTime: values.startTime,
          endTime: values.endTime
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAvailabilityQueryKey({ date: dateStr }) });
          toast({ title: "Availability added" });
        },
        onError: (err: any) => {
          toast({ 
            title: "Failed to add availability", 
            description: err.message,
            variant: "destructive" 
          });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteAvailability.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAvailabilityQueryKey({ date: dateStr }) });
          toast({ title: "Availability removed" });
        },
        onError: () => toast({ title: "Failed to remove availability", variant: "destructive" })
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground mt-1">Set your working hours for specific dates.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="col-span-1 border-none shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="font-serif">Select Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-xl border shadow-sm p-4 bg-background"
              />
            </CardContent>
          </Card>

          <div className="col-span-1 lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  {format(selectedDate, "EEEE, MMMM do, yyyy")}
                </CardTitle>
                <CardDescription>Add or remove available time blocks for this day.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Existing Ranges */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Current Hours</h3>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-14 w-full rounded-lg" />
                      <Skeleton className="h-14 w-full rounded-lg" />
                    </div>
                  ) : availability && availability.length > 0 ? (
                    <div className="space-y-3">
                      {availability.map(range => (
                        <div key={range.id} className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium text-lg">
                              {range.startTime} - {range.endTime}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(range.id)}
                            disabled={deleteAvailability.isPending}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed rounded-xl bg-muted/30">
                      <p className="text-muted-foreground">No availability set for this date.</p>
                    </div>
                  )}
                </div>

                <div className="bg-border h-px w-full my-6"></div>

                {/* Add Range Form */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Add Time Block</h3>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Start Time (24h)</FormLabel>
                            <FormControl>
                              <Input placeholder="09:00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>End Time (24h)</FormLabel>
                            <FormControl>
                              <Input placeholder="17:00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createAvailability.isPending} className="px-8">
                        Add
                      </Button>
                    </form>
                  </Form>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
