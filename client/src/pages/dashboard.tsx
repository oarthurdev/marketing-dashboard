
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  Eye,
  MousePointer,
  ShoppingCart,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";
import { CampaignTable } from "@/components/campaign-table";
import ActivityFeed from "@/components/activity-feed";

interface DashboardData {
  totalRevenue: number;
  totalLeads: number;
  conversionRate: number;
  avgOrderValue: number;
  campaigns: Array<{
    id: string;
    name: string;
    platform: string;
    status: string;
    budget: number;
    spent: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
    leads: number;
  }>;
  leadSources: Array<{
    source: string;
    leads: number;
    revenue: number;
  }>;
  activities: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

interface KommoStatus {
  isConnected: boolean;
  lastSync: string;
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState("7");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: dashboardData, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard", dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard?days=${dateRange}`);
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      return response.json();
    },
  });

  const { data: kommoStatus } = useQuery<KommoStatus>({
    queryKey: ["kommo-status"],
    queryFn: async () => {
      const response = await fetch("/api/kommo/status");
      if (!response.ok) throw new Error("Failed to fetch Kommo status");
      return response.json();
    },
  });

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/export/dashboard?days=${dateRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `dashboard-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <h2 className="text-2xl font-semibold text-foreground">Carregando Dashboard</h2>
          <p className="text-muted-foreground">Processando dados em tempo real...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Receita Total",
      value: `R$ ${dashboardData?.totalRevenue?.toLocaleString() || "0"}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total de Leads",
      value: dashboardData?.totalLeads?.toLocaleString() || "0",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Taxa de Conversão",
      value: `${dashboardData?.conversionRate?.toFixed(1) || "0"}%`,
      change: "+2.1%",
      trend: "up",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${dashboardData?.avgOrderValue?.toLocaleString() || "0"}`,
      change: "-1.4%",
      trend: "down",
      icon: ShoppingCart,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-mesh" data-testid="dashboard-layout">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border" data-testid="dashboard-header">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="gradient-bg p-3 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Marketing Dashboard
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-muted-foreground">
                    Performance em tempo real
                  </p>
                  {kommoStatus?.isConnected && (
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      <Activity className="w-3 h-3 mr-1" />
                      Kommo CRM Conectado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date Range Picker */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-44" data-testid="select-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Este trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="group"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                Atualizar
              </Button>
              
              <Button 
                variant="gradient" 
                onClick={handleExport}
                data-testid="button-export"
                className="shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={stat.title} className="card-hover border-0 shadow-lg glass-effect animate-fade-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <div className="flex items-center space-x-1">
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-muted-foreground">vs período anterior</span>
                    </div>
                  </div>
                  <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center`}>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tables and Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-up" style={{ animationDelay: "600ms" }}>
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-lg glass-effect">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <PieChart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Campanhas Ativas</CardTitle>
                      <CardDescription>Performance detalhada por campanha</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {dashboardData?.campaigns?.length || 0} ativas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CampaignTable campaigns={dashboardData?.campaigns || []} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-0 shadow-lg glass-effect">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Atividade Recente</CardTitle>
                    <CardDescription>Últimas atualizações</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ActivityFeed activities={dashboardData?.activities || []} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
