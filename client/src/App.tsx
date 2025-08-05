import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import RoleSelection from "@/pages/role-selection";
import SuperAdminSetup from "@/pages/superadmin-setup";
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

  // If user is authenticated but has default 'client' role and no associated records, show role selection
  if (user && user.role === 'client' && !(user as any).client) {
    return <RoleSelection />;
  }

  // If user is a trainer but pending approval
  if (user && user.role === 'trainer' && user.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
            <p className="text-gray-600 mb-4">
              Your trainer account is under review. You'll receive access once approved by our administrators.
            </p>
            <div className="text-sm text-gray-500">
              <p>This usually takes 24-48 hours.</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = "/api/logout"}
            className="text-primary hover:text-primary-dark"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
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
        <Switch>
          <Route path="/setup-superadmin" component={SuperAdminSetup} />
          <Route component={Router} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
