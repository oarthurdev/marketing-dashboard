import React from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Router, Route, Switch } from "wouter";
import AuthGuard from "@/components/auth-guard";
import Sidebar from "@/components/sidebar";

// Auth pages
import Login from "@/pages/login";
import TrialSignup from "@/pages/trial-signup";
import TrialConfirmation from "@/pages/trial-confirmation";
import Pricing from "@/pages/pricing";

// Protected pages
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import type { ApiConnection } from "@shared/schema";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Componente "interno" que já está dentro do Provider
function AppInner() {
  const {
    data: connections,
    isLoading,
    error,
  } = useQuery<ApiConnection[]>({
    queryKey: ["/api/dashboard/connections"],
  });

  // fallback leve pro sidebar (não quebra layout enquanto carrega/erro)
  const safeConnections = connections ?? [];

  return (
    <TooltipProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Switch>
            {/* Public routes */}
            <Route path="/login" component={Login} />
            {/* Protected routes */}
            <Route path="/">
              <AuthGuard>
                <div className="flex">
                  <Sidebar
                    connections={safeConnections}
                    loading={isLoading}
                    error={!!error}
                  />
                  <main className="flex-1 ml-64">
                    <div className="p-8">
                      <Dashboard />
                    </div>
                  </main>
                </div>
              </AuthGuard>
            </Route>

            <Route path="/campaigns">
              <AuthGuard>
                <div className="flex">
                  <Sidebar
                    connections={safeConnections}
                    loading={isLoading}
                    error={!!error}
                  />
                  <main className="flex-1 ml-64">
                    <div className="p-8">
                      <Campaigns />
                    </div>
                  </main>
                </div>
              </AuthGuard>
            </Route>

            {/* Default route */}
            <Route path="/">
              <AuthGuard>
                <div className="flex">
                  <Sidebar
                    connections={safeConnections}
                    loading={isLoading}
                    error={!!error}
                  />
                  <main className="flex-1 ml-64">
                    <div className="p-8">
                      <Dashboard />
                    </div>
                  </main>
                </div>
              </AuthGuard>
            </Route>

            {/* 404 route */}
            <Route component={NotFound} />
          </Switch>
        </div>
      </Router>
      <Toaster />
    </TooltipProvider>
  );
}

// Provider fica no nível mais alto
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}

export default App;
