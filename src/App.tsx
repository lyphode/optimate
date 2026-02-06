import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Placeholder pages - to be implemented
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
    <p className="text-muted-foreground">This page will be implemented in the next phase.</p>
  </div>
);

const ClientsPage = () => <PlaceholderPage title="Clients" />;
const ProjectsPage = () => <PlaceholderPage title="Projects" />;
const SlabsPage = () => <PlaceholderPage title="Stock Slabs" />;
const OffcutsPage = () => <PlaceholderPage title="Off-Cuts" />;
const OptimizerPage = () => <PlaceholderPage title="Nesting Optimizer" />;
const ReportsPage = () => <PlaceholderPage title="Reports" />;
const SettingsPage = () => <PlaceholderPage title="Settings" />;

function AppRoutes() {
  const { user, isLoading } = useAuth();

  // Redirect authenticated users away from auth page
  if (!isLoading && user && window.location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      
      {/* Protected Routes with Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ClientsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProjectsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/slabs"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SlabsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory/offcuts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <OffcutsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/optimizer"
        element={
          <ProtectedRoute>
            <AppLayout>
              <OptimizerPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
