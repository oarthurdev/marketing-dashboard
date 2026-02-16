import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Activity } from "lucide-react";

import SalesFunnel from "@/components/SalesFunnel";
import { LeadsPipelineChart } from "@/components/LeadsPipelineChart";
import ThemeToggle from "@/components/ui/theme-toggle";
import StageResponseChart from "@/components/StageResponseChart";
import ErrosDaIAChart from "@/components/ErrosDaIAChart";

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
  stages: {
    position: number;
    stageId: string;
    averageFirstResponseSeconds: number;
  }[];
}

async function fetchStageMetrics(): Promise<StageMetricsResponse> {
  const res = await fetch(
    "/kommo/stage-metrics?stageA=90776156&stageB=90776160"
  );
  if (!res.ok) throw new Error("Erro métricas Kommo");
  return res.json();
}

export default function Dashboard() {
  const [funnelRange, setFunnelRange] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data: funnelData } = useQuery({
    queryKey: ["sales-funnel", funnelRange],
    queryFn: async () => {
      const res = await fetch(`/api/funnel?range=${funnelRange}`);
      if (!res.ok) throw new Error("Erro funil");
      return res.json();
    },
  });

  const { data: stageMetrics, isLoading: loadingStages } = useQuery({
    queryKey: ["kommo-stage-metrics"],
    queryFn: fetchStageMetrics,
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
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

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
                  funnelRange={funnelRange}
                  setFunnelRange={setFunnelRange}
                />
              )}
            </CardContent>
          </Card>

          {/* PIPELINE — grande */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Pipeline de Leads</CardTitle>
              <CardDescription>Distribuição por etapa</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsPipelineChart />
            </CardContent>
          </Card>

          {/* TEMPO RESPOSTA — médio */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Tempo de Resposta</CardTitle>
              <CardDescription>
                Comparação: IA vs Atendimento Humano
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {loadingStages ? (
                <p className="text-sm text-muted-foreground">Calculando...</p>
              ) : (
                stageMetrics && <StageResponseChart data={stageMetrics.stages} />
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
              <ErrosDaIAChart stageId="100621824" />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}