import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Sidebar from "@/components/sidebar";
import KPIGrid from "@/components/kpi-grid";
import ChartsSection from "@/components/charts-section";
import CampaignTable from "@/components/campaign-table";
import ActivityFeed from "@/components/activity-feed";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Metrics, Campaign, Activity, ApiConnection } from "@shared/schema";

export default function Dashboard() {
  const [dateRange, setDateRange] = useState("7");
  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<Metrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/dashboard/campaigns'],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['/api/dashboard/activities'],
  });

  const { data: connections } = useQuery<ApiConnection[]>({
    queryKey: ['/api/dashboard/connections'],
  });

  const { data: historicalData } = useQuery<Metrics[]>({
    queryKey: ['/api/dashboard/historical', dateRange],
  });

  const handleRefresh = async () => {
    try {
      await apiRequest('POST', '/api/dashboard/refresh');
      await refetchMetrics();
      toast({
        title: "Data Refreshed",
        description: "Dashboard data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiRequest('POST', '/api/reports/generate', { type: 'daily' });
      const data = await response.json();
      
      // Create and download blob
      const blob = new Blob([data.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketing-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: "Daily marketing report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isLoading = metricsLoading || campaignsLoading || activitiesLoading;

  return (
    <div className="min-h-screen flex bg-gray-50" data-testid="dashboard-layout">
      <Sidebar connections={connections || []} />
      
      <main className="flex-1 ml-64 p-6" data-testid="main-content">
        {/* Header */}
        <header className="flex items-center justify-between mb-8" data-testid="dashboard-header">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
            <p className="text-gray-500">Daily performance overview</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Date Range Picker */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40" data-testid="select-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">This quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleExport}
              data-testid="button-export"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            
            <Button 
              onClick={handleRefresh}
              disabled={isLoading}
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" 
                alt="User profile" 
                className="w-8 h-8 rounded-full"
                data-testid="img-user-avatar"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900" data-testid="text-user-name">John Mitchell</p>
                <p className="text-gray-500" data-testid="text-user-role">Marketing Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* KPI Grid */}
        <KPIGrid metrics={metrics} isLoading={metricsLoading} />

        {/* Charts Section */}
        <ChartsSection historicalData={historicalData} metrics={metrics} />

        {/* Data Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CampaignTable campaigns={campaigns || []} isLoading={campaignsLoading} />
          <ActivityFeed activities={activities || []} isLoading={activitiesLoading} />
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-gray-200 pt-6" data-testid="dashboard-footer">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <p>Last updated: <span data-testid="text-last-updated">
                {metrics?.createdAt ? new Date(metrics.createdAt).toLocaleString() : 'Never'}
              </span></p>
              <p>Next refresh: <span data-testid="text-next-refresh">In 6 hours</span></p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/api-settings">
                <a className="text-sm text-gray-500 hover:text-gray-700" data-testid="button-api-settings">
                  API Settings
                </a>
              </Link>
              <button className="text-sm text-gray-500 hover:text-gray-700" data-testid="button-support">
                Help & Support
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
