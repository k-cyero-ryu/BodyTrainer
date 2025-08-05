import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import TrainerDashboard from "@/pages/trainer-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Clients from "@/pages/clients";
import TrainingPlans from "@/pages/training-plans";
import Exercises from "@/pages/exercises";
import Reports from "@/pages/reports";
import Navigation from "@/components/navigation";
import Chat from "@/components/chat";
import "@/lib/i18n";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Switch>
        {user?.role === 'superadmin' && (
          <Route path="/" component={AdminDashboard} />
        )}
        {user?.role === 'trainer' && (
          <>
            <Route path="/" component={TrainerDashboard} />
            <Route path="/clients" component={Clients} />
            <Route path="/plans" component={TrainingPlans} />
            <Route path="/exercises" component={Exercises} />
            <Route path="/reports" component={Reports} />
          </>
        )}
        {user?.role === 'client' && (
          <Route path="/" component={ClientDashboard} />
        )}
        <Route component={NotFound} />
      </Switch>
      {isAuthenticated && <Chat />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
