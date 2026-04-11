import { AdminLayout } from "@/components/admin-layout";
import { useGetAdminSummary, useGetUpcomingBookings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Scissors, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetAdminSummary();
  const { data: upcoming, isLoading: upcomingLoading } = useGetUpcomingBookings({ limit: 5 });

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your salon's activity.</p>
        </div>

        {summaryLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : summary ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-serif">{summary.todayBookings}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
                <div className="h-8 w-8 bg-secondary/30 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-secondary-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-serif">{summary.upcomingBookings}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <div className="h-8 w-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-serif">{summary.totalBookings}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Active Designs</CardTitle>
                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                  <Scissors className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-serif">{summary.totalDesigns}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif">Upcoming Appointments</CardTitle>
              <CardDescription>Your next 5 scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : upcoming && upcoming.length > 0 ? (
                <div className="space-y-6">
                  {upcoming.map(booking => (
                    <div key={booking.id} className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex flex-col items-center justify-center mr-4 text-primary shrink-0">
                        <span className="text-xs font-bold">{format(new Date(booking.date), "MMM")}</span>
                        <span className="text-sm font-bold leading-none">{format(new Date(booking.date), "dd")}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{booking.customerName}</p>
                        <p className="text-sm text-muted-foreground">{booking.designName}</p>
                      </div>
                      <div className="font-medium text-sm tabular-nums">
                        {booking.startTime}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  No upcoming bookings.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif">Popular Designs</CardTitle>
              <CardDescription>Most booked styles all-time</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : summary?.popularDesigns && summary.popularDesigns.length > 0 ? (
                <div className="space-y-4">
                  {summary.popularDesigns.map((item, index) => (
                    <div key={item.designId} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium">{item.designName}</span>
                      </div>
                      <span className="text-sm font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                        {item.bookingCount} books
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  Not enough data yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
