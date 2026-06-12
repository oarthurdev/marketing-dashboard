import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Activity, Filter } from "lucide-react";
import SalesFunnel from "@/components/SalesFunnel";
import { LeadsPipelineChart } from "@/components/LeadsPipelineChart";
import ThemeToggle from "@/components/ui/theme-toggle";
import StageResponseChart from "@/components/StageResponseChart";
import { TagPieChart } from "@/components/TagPieChart";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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
  totalRowsHuman: number;
  totalRowsAi: number;
  sumResponseTimeHuman: number; // segundos (total do mês)
  sumResponseTimeAi: number;    // segundos (total do mês)
}

type PeriodMode = "daily" | "weekly" | "fortnightly" | "monthly" | "custom";

function getPresetRange(mode: Exclude<PeriodMode, "custom">): DateRange {
  const to = new Date();
  to.setHours(0, 0, 0, 0);

  const from = new Date(to);

  if (mode === "weekly") {
    from.setDate(from.getDate() - 6);
  } else if (mode === "fortnightly") {
    from.setDate(from.getDate() - 14);
  } else if (mode === "monthly") {
    from.setDate(1);
  }

  return { from, to };
}

function formatDateParam(date?: Date): string | undefined {
  if (!date) return undefined;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


async function fetchStageMetrics(month: string): Promise<StageMetricsResponse> {
  const res = await fetch(`/kommo/stage-metrics?month=${month}`);
  if (!res.ok) throw new Error("Erro métricas Kommo");
  return res.json();
}

export default function Dashboard() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>("custom");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  const selectedRange = useMemo(
    () => periodMode === "custom" ? customRange : getPresetRange(periodMode),
    [periodMode, customRange]
  );

  const dateFrom = formatDateParam(selectedRange?.from);
  const dateTo = formatDateParam(selectedRange?.to);

  const { data: funnelData } = useQuery({
    queryKey: ["sales-funnel", dateFrom, dateTo],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (dateFrom) query.set('dateFrom', dateFrom);
      if (dateTo) query.set('dateTo', dateTo);
      const res = await fetch(`/api/dashboard/funnel?${query.toString()}`);
      if (!res.ok) throw new Error("Erro funil");
      return res.json();
    },
  });

  const { data: stageMetrics, isLoading: loadingStages } = useQuery({
    queryKey: ["kommo-stage-metrics", dateFrom, dateTo],
    queryFn: () => fetchStageMetrics("current"),
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
            <div className="flex items-center gap-2">
              <Select value={periodMode} onValueChange={(value) => setPeriodMode(value as PeriodMode)}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="fortnightly">Quinzenal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {periodMode === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-48">
                      {selectedRange?.from && selectedRange?.to
                        ? `${selectedRange.from.toLocaleDateString('pt-BR')} - ${selectedRange.to.toLocaleDateString('pt-BR')}`
                        : selectedRange?.from
                        ? `A partir de ${selectedRange.from.toLocaleDateString('pt-BR')}`
                        : "Selecionar período"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={customRange}
                      onSelect={setCustomRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

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
              <TagPieChart dateFrom={dateFrom} dateTo={dateTo} />
            </CardContent>
          </Card>

          {/* PIPELINE — grande */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Pipeline de Leads</CardTitle>
              <CardDescription>Distribuição por etapa</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsPipelineChart dateFrom={dateFrom} dateTo={dateTo} />
            </CardContent>
          </Card>

          {/* TEMPO RESPOSTA — médio */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Tempo de Resposta</CardTitle>
              <CardDescription>Atendimento Humano</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {loadingStages ? (
                <p className="text-sm text-muted-foreground">Calculando...</p>
              ) : (
                stageMetrics && <StageResponseChart metrics={stageMetrics} />
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
