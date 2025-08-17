
import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import ApiSettings from "@/pages/api-settings";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import type { ApiConnection } from "@shared/schema";

function Router() {
  const { data: connections } = useQuery<ApiConnection[]>({
    queryKey: ['/api/dashboard/connections'],
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar connections={connections || []} />
      
      <main className="flex-1 ml-64 p-6">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/api-settings" component={ApiSettings} />
          <Route path="/reports" component={Reports} />
          <Route component={NotFound} />
        </Switch>
      </main>
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
