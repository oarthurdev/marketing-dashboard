import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Activity } from "lucide-react";
import SalesFunnel from "@/components/SalesFunnel";
import { LeadsPipelineChart } from "@/components/LeadsPipelineChart";
import ThemeToggle from "@/components/ui/theme-toggle";
import StageResponseChart from "@/components/StageResponseChart";
import ErrosDaIAChart from "@/components/ErrosDaIAChart";
import { TagPieChart } from "@/components/TagPieChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardData {
  totalRevenue: number;
  totalLeads: number;
  conversionRate: number;
  avgOrderValue: number;
  funnel?: {
    leads: number;
    opportunities: number;
    visits: number;
    reservations: number;
    sales: number;
  };
}

interface KommoStatus {
  isConnected: boolean;
}

interface StageMetricsResponse {
  monthStart: string;
  monthEnd: string;
  totalRows: number;
  sumResponseTimeHuman: number; // segundos (total do mês)
  sumResponseTimeAi: number;    // segundos (total do mês)
}


async function fetchStageMetrics(month: string): Promise<StageMetricsResponse> {
  const res = await fetch(`/kommo/stage-metrics?month=${month}`);
  if (!res.ok) throw new Error("Erro métricas Kommo");
  return res.json();
}

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    options.push({ value: "all", label: "Todos os meses" });

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }, []);

  const { data: funnelData } = useQuery({
    queryKey: ["sales-funnel", selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/funnel?month=${selectedMonth}`);
      if (!res.ok) throw new Error("Erro funil");
      return res.json();
    },
  });

  const { data: stageMetrics, isLoading: loadingStages } = useQuery({
    queryKey: ["kommo-stage-metrics", selectedMonth],
    queryFn: () => fetchStageMetrics(selectedMonth === "all" ? "current" : selectedMonth),
    refetchInterval: 60000,
  });


  return (
    <div>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl shadow bg-primary">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-muted-foreground">Performance em tempo real</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-[minmax(180px,auto)]">

          {/* FUNIL — destaque principal */}
          <Card className="xl:col-span-2 xl:row-span-2">
            <CardHeader>
              <CardTitle>Funil de Vendas</CardTitle>
              <CardDescription>Conversão por etapa</CardDescription>
            </CardHeader>
            <CardContent>
              {funnelData && (
                <SalesFunnel
                  rangeLabel={funnelData.rangeLabel}
                  data={funnelData.data}
                />
              )}
            </CardContent>
          </Card>

          {/* TAGS — abaixo do funil */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Distribuição por Tags</CardTitle>
              <CardDescription>
                Quantidade de leads agrupados por tag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagPieChart month={selectedMonth} />
            </CardContent>
          </Card>

          {/* PIPELINE — grande */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Pipeline de Leads</CardTitle>
              <CardDescription>Distribuição por etapa</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsPipelineChart month={selectedMonth} />
            </CardContent>
          </Card>

          {/* TEMPO RESPOSTA — médio */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Tempo de Resposta</CardTitle>
              <CardDescription>Comparação: IA vs Atendimento Humano</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {loadingStages ? (
                <p className="text-sm text-muted-foreground">Calculando...</p>
              ) : (
                stageMetrics && <StageResponseChart metrics={stageMetrics} />
              )}
            </CardContent>
          </Card>

          {/* LEADS NA ETAPA — menor KPI */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Erros da IA</CardTitle>
              <CardDescription>
                Quantidade de erros no mês
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center">
              <ErrosDaIAChart stageId="100621824" month={selectedMonth} />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
