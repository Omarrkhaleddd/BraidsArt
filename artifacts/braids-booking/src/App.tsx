import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AdminGuard } from "@/components/admin-guard";

import Home from "@/pages/home";
import Book from "@/pages/book";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminDesigns from "@/pages/admin/designs";
import AdminAvailability from "@/pages/admin/availability";
import AdminBookings from "@/pages/admin/bookings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/book" component={Book} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <AdminGuard>
          <AdminDashboard />
        </AdminGuard>
      </Route>
      <Route path="/admin/designs">
        <AdminGuard>
          <AdminDesigns />
        </AdminGuard>
      </Route>
      <Route path="/admin/availability">
        <AdminGuard>
          <AdminAvailability />
        </AdminGuard>
      </Route>
      <Route path="/admin/bookings">
        <AdminGuard>
          <AdminBookings />
        </AdminGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
