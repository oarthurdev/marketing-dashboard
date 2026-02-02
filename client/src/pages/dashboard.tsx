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

function formatDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Math.max(0, days - 1));
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR');
  return `${fmt(start)} A ${fmt(end)}`;
}

import { CampaignTable } from "@/components/campaign-table";
import ActivityFeed from "@/components/activity-feed";
import SalesFunnel from "@/components/SalesFunnel";

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

  // (Opcional) Se o backend já devolver o funil pronto, usamos direto.
  funnel?: {
    leads: number;
    opportunities: number;
    visits: number;
    reservations: number;
    sales: number;
  };
}

function formatDatePtBR(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function buildFunnelTitle(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Math.max(1, days) + 1);
  return `PERÍODO - ${formatDatePtBR(start)} A ${formatDatePtBR(end)}`;
}

function pct(part: number, whole: number) {
  if (!whole) return 0;
  return (part / whole) * 100;
}

type FunnelData = Required<NonNullable<DashboardData["funnel"]>>;

interface KommoStatus {
  isConnected: boolean;
  lastSync: string;
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState("7");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [funnelRange, setFunnelRange] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data: funnelData } = useQuery({
    queryKey: ["sales-funnel", funnelRange],
    queryFn: async () => {
      const res = await fetch(`/api/funnel?range=${funnelRange}`);
      if (!res.ok) throw new Error("Erro ao buscar funil");
      return res.json();
    },
  });

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

  const daysForTitle = dateRange === "7" ? 7 : dateRange === "90" ? 90 : dateRange === "365" ? 365 : 30;

  return (
    <div data-testid="dashboard-layout">
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
          </div>
        </div>
      </header>
      <br />
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Funil de Vendas */}
        <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold" style={{marginRight: "1rem"}}>Período</h2>

        <Select value={funnelRange} onValueChange={(v) => setFunnelRange(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Diário</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
          </SelectContent>
        </Select>
      </div>

        {funnelData && (
          <SalesFunnel
            rangeLabel={funnelData.rangeLabel}
            data={funnelData.data}
          />
        )}
      </div>
    </div>
  );
}