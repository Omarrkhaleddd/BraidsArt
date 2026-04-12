import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { useListBookings, useDeleteBooking, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Calendar as CalendarIcon, Phone, Mail, Clock, FilterX, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminBookings() {
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const dateStr = dateFilter ? format(dateFilter, "yyyy-MM-dd") : undefined;

  const { data: bookings, isLoading } = useListBookings(dateStr ? { date: dateStr } : undefined);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteBooking = useDeleteBooking();

  const handleDelete = (id: number) => {
    deleteBooking.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey(dateStr ? { date: dateStr } : undefined) });
          toast({ title: "Booking cancelled successfully" });
        },
        onError: () => toast({ title: "Failed to cancel booking", variant: "destructive" }),
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">Bookings</h1>
            <p className="text-muted-foreground mt-1">View and manage all customer appointments.</p>
          </div>

          <div className="flex items-center gap-2">
            {dateFilter && (
              <Button variant="ghost" onClick={() => setDateFilter(undefined)} className="text-muted-foreground h-10 px-3">
                <FilterX className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`w-[220px] justify-start text-left font-normal h-10 ${!dateFilter ? "text-muted-foreground" : ""}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : <span>Filter by date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[180px]">Customer</TableHead>
                      <TableHead>Style</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Price & Payment</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const isPast = new Date(`${booking.date}T${booking.endTime}`) < new Date();
                      const depositAmount = Math.round(booking.finalPrice * 0.2);
                      return (
                        <TableRow key={booking.id} className={isPast ? "opacity-60 bg-muted/20" : ""}>
                          <TableCell>
                            <div className="font-medium">{booking.customerName}</div>
                            {booking.notes && (
                              <div className="text-xs text-muted-foreground mt-1 truncate max-w-[160px]" title={booking.notes}>
                                Note: {booking.notes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant="secondary" className="font-normal border-primary/20 bg-primary/5 text-primary w-fit">
                                {booking.designName}
                              </Badge>
                              {booking.withExtension && (
                                <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 bg-amber-50 w-fit gap-1">
                                  <Sparkles className="h-2.5 w-2.5" /> Extension
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{booking.durationHours}h</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium whitespace-nowrap">{format(new Date(booking.date), "MMM do, yyyy")}</span>
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {booking.startTime} – {booking.endTime}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              <span className="font-semibold">{Number(booking.finalPrice).toLocaleString()} EGP</span>
                              <span className="text-xs text-muted-foreground">Deposit: {depositAmount.toLocaleString()} EGP</span>
                              <Badge
                                variant={booking.depositPaid ? "default" : "outline"}
                                className={`text-xs w-fit ${booking.depositPaid ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100" : "text-muted-foreground"}`}
                              >
                                {booking.depositPaid ? "✓ Deposit Paid" : "Pending"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1.5 text-sm">
                              {booking.customerPhone && (
                                <span className="flex items-center text-muted-foreground">
                                  <Phone className="h-3 w-3 mr-2" />{booking.customerPhone}
                                </span>
                              )}
                              {booking.customerEmail && (
                                <span className="flex items-center text-muted-foreground">
                                  <Mail className="h-3 w-3 mr-2" />{booking.customerEmail}
                                </span>
                              )}
                              {!booking.customerPhone && !booking.customerEmail && (
                                <span className="text-muted-foreground italic text-xs">No contact</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cancel the appointment for <strong>{booking.customerName}</strong> on {format(new Date(booking.date), "MMM do")}? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(booking.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Cancel Booking
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-20 px-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No bookings found</h3>
                <p className="text-muted-foreground">
                  {dateFilter
                    ? `No appointments scheduled for ${format(dateFilter, "MMMM do, yyyy")}.`
                    : "Your schedule is clear."}
                </p>
                {dateFilter && (
                  <Button variant="outline" className="mt-6" onClick={() => setDateFilter(undefined)}>
                    View All Bookings
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
