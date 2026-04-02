import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  DollarSign,
  Users,
  MousePointerClick,
  Eye,
  TrendingUp,
  Layers,
  Megaphone,
  ArrowUpDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AnyRow = Record<string, any>;

type Campaign = AnyRow & {
  id: string;
  name?: string | null;
  platform?: string | null;

  status?: string | null;
  effective_status?: string | null;
  effectiveStatus?: string | null;
  is_archived?: boolean | null;
  isArchived?: boolean | null;

  spend?: number | string | null;
  clicks_last_30d?: number | null;
  impressions_last_30d?: number | null;
  ctr_last_30d?: number | string | null;
  cpc_last_30d?: number | string | null;
  cpa?: number | string | null;

  revenue?: number | string | null;

  leads?: number | null;

  start_date?: string | null;
  end_date?: string | null;
  updated_at?: string | null;
  created_at?: string | null;

  adsets?: Adset[];
};

type Adset = AnyRow & {
  id: string;
  campaign_id?: string | null;
  campaignId?: string | null;
  name?: string | null;

  status?: string | null;
  effective_status?: string | null;
  effectiveStatus?: string | null;
  is_archived?: boolean | null;
  isArchived?: boolean | null;

  spend?: number | string | null;
  clicks_last_30d?: number | null;
  impressions_last_30d?: number | null;
  ctr_last_30d?: number | string | null;
  cpc_last_30d?: number | string | null;
  cpa?: number | string | null;

  leads?: number | null;

  ads?: Ad[];
};

type Ad = AnyRow & {
  id: string;
  campaign_id?: string | null;
  campaignId?: string | null;
  adset_id?: string | null;
  adsetId?: string | null;
  name?: string | null;

  status?: string | null;
  effective_status?: string | null;
  effectiveStatus?: string | null;
  is_archived?: boolean | null;
  isArchived?: boolean | null;

  spend?: number | string | null;
  clicks_last_30d?: number | null;
  impressions_last_30d?: number | null;
  ctr_last_30d?: number | string | null;
  cpc_last_30d?: number | string | null;
  cpa?: number | string | null;

  leads?: number | null;
};

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const cleaned = v.replace(",", ".");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function moneyBRL(v: unknown): string {
  const n = toNumber(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(v: unknown, digits = 2): string {
  const n = toNumber(v);
  return `${n.toFixed(digits)}%`;
}

function safeDateBR(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR");
}

function normalizeStatus(x: AnyRow): string {
  const eff = (x.effective_status ?? x.effectiveStatus ?? x.status ?? "")
    .toString()
    .toUpperCase()
    .trim();
  const archived = Boolean(x.is_archived ?? x.isArchived);
  if (archived) return "ARCHIVED";
  return eff || "UNKNOWN";
}

function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "PAUSED") return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "ARCHIVED") return "bg-slate-100 text-slate-800 border-slate-200";
  if (s === "DELETED") return "bg-rose-100 text-rose-800 border-rose-200";
  return "bg-zinc-100 text-zinc-800 border-zinc-200";
}

function statusLabel(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "Ativa";
    case "PAUSED":
      return "Pausada";
    case "ARCHIVED":
      return "Arquivada";
    case "DELETED":
      return "Deletada";
    default:
      return status || "—";
  }
}

function platformLabel(p?: string | null): string {
  const v = (p || "").toLowerCase();
  if (v === "meta" || v === "meta_ads") return "Meta Ads";
  if (v === "google_ads") return "Google Ads";
  if (v === "tiktok_ads") return "TikTok Ads";
  if (v === "linkedin_ads") return "LinkedIn Ads";
  return p || "—";
}

function computeCPL(spend: unknown, leads?: number | null): number | null {
  const s = toNumber(spend);
  const l = typeof leads === "number" ? leads : 0;
  if (!l || l <= 0) return null;
  return s / l;
}

/**
 * Aceita:
 * 1) { campaigns:[], adsets:[], ads:[] }
 * 2) { data:[{... adsets:[{... ads:[] }]}] }  (já aninhado)
 * 3) [ { id, name, ... } ] (só campanhas)
 */
function normalizeHierarchy(payload: any): Campaign[] {
  if (!payload) return [];

  // =========================
  // formato 2: aninhado em data
  // =========================
  if (Array.isArray(payload?.data)) {
    return payload.data.map((c: any) => ({
      ...c,
      id: String(c.id),
      start_date: c.start_date ?? c.startDate ?? null,
      end_date: c.end_date ?? c.endDate ?? null,
      created_at: c.created_at ?? c.createdAt,
      adsets: Array.isArray(c.adsets)
        ? c.adsets.map((as: any) => ({
            ...as,
            id: String(as.id),
            campaign_id: String(as.campaign_id ?? as.campaignId ?? c.id),
            clicks_last_30d: as.clicks_last_30d ?? as.clicksLast30d ?? 0,
            impressions_last_30d: as.impressions_last_30d ?? as.impressionsLast30d ?? 0,
            ctr_last_30d: as.ctr_last_30d ?? as.ctrLast30d ?? null,
            cpc_last_30d: as.cpc_last_30d ?? as.cpcLast30d ?? null,
            ads: Array.isArray(as.ads)
              ? as.ads.map((ad: any) => ({
                  ...ad,
                  id: String(ad.id),
                  campaign_id: String(ad.campaign_id ?? ad.campaignId ?? c.id),
                  adset_id: String(ad.adset_id ?? ad.adsetId ?? as.id),
                  clicks_last_30d: ad.clicks_last_30d ?? ad.clicksLast30d ?? 0,
                  impressions_last_30d: ad.impressions_last_30d ?? ad.impressionsLast30d ?? 0,
                  ctr_last_30d: ad.ctr_last_30d ?? ad.ctrLast30d ?? null,
                  cpc_last_30d: ad.cpc_last_30d ?? ad.cpcLast30d ?? null,
                }))
              : [],
          }))
        : [],
    }));
  }

  // =========================
  // formato 1: listas separadas (SEU CASO ATUAL)
  // =========================
  if (
    Array.isArray(payload?.campaigns) &&
    Array.isArray(payload?.adsets) &&
    Array.isArray(payload?.ads)
  ) {
    const campaigns = payload.campaigns.map((c: any) => ({
      ...c,
      id: String(c.id),
      start_date: c.start_date ?? c.startDate ?? null,
      end_date: c.end_date ?? c.endDate ?? null,
      created_at: c.created_at ?? c.createdAt,
    })) as Campaign[];

    const adsets = payload.adsets.map((as: any) => ({
      ...as,
      id: String(as.id),
      campaign_id: String(as.campaign_id ?? as.campaignId ?? ''),
      clicks_last_30d: as.clicks_last_30d ?? as.clicksLast30d ?? 0,
      impressions_last_30d: as.impressions_last_30d ?? as.impressionsLast30d ?? 0,
      ctr_last_30d: as.ctr_last_30d ?? as.ctrLast30d ?? null,
      cpc_last_30d: as.cpc_last_30d ?? as.cpcLast30d ?? null,
    })) as Adset[];

    const ads = payload.ads.map((ad: any) => ({
      ...ad,
      id: String(ad.id),
      campaign_id: String(ad.campaign_id ?? ad.campaignId ?? ''),
      adset_id: String(ad.adset_id ?? ad.adsetId ?? ''),
      clicks_last_30d: ad.clicks_last_30d ?? ad.clicksLast30d ?? 0,
      impressions_last_30d: ad.impressions_last_30d ?? ad.impressionsLast30d ?? 0,
      ctr_last_30d: ad.ctr_last_30d ?? ad.ctrLast30d ?? null,
      cpc_last_30d: ad.cpc_last_30d ?? ad.cpcLast30d ?? null,
    })) as Ad[];

    const adsetsByCampaign = new Map<string, Adset[]>();
    for (const as of adsets) {
      const cid = String(as.campaign_id || '');
      if (!cid) continue;
      if (!adsetsByCampaign.has(cid)) adsetsByCampaign.set(cid, []);
      adsetsByCampaign.get(cid)!.push({ ...as, ads: [] });
    }

    const adsByAdset = new Map<string, Ad[]>();
    for (const ad of ads) {
      const asid = String(ad.adset_id || '');
      if (!asid) continue;
      if (!adsByAdset.has(asid)) adsByAdset.set(asid, []);
      adsByAdset.get(asid)!.push(ad);
    }

    for (const [, list] of adsetsByCampaign.entries()) {
      for (const as of list) {
        const asid = String(as.id);
        const arr = adsByAdset.get(asid) || [];
        arr.sort((a, b) => toNumber(b.spend) - toNumber(a.spend));
        as.ads = arr;
      }
      list.sort((a, b) => toNumber(b.spend) - toNumber(a.spend));
    }

    const out = campaigns.map(c => ({
      ...c,
      adsets: adsetsByCampaign.get(String(c.id)) || [],
    }));

    out.sort((a, b) => toNumber(b.spend) - toNumber(a.spend));
    return out;
  }

  // =========================
  // formato 3: array simples
  // =========================
  if (Array.isArray(payload)) {
    return payload.map((c: any) => ({
      ...c,
      id: String(c.id),
      start_date: c.start_date ?? c.startDate ?? null,
      end_date: c.end_date ?? c.endDate ?? null,
      created_at: c.created_at ?? c.createdAt,
      adsets: [],
    })) as Campaign[];
  }

  return [];
}

type SortKey = "spend" | "clicks" | "cpa" | "name";

export default function Campaigns() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedAdsetId, setSelectedAdsetId] = useState<string | null>(null);

  const [adsSort, setAdsSort] = useState<SortKey>("spend");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/dashboard/campaigns/hierarchy"],
    queryFn: async () => {
      // tenta hierarchy primeiro; se não existir, cai no endpoint antigo
      const res1 = await fetch("/api/dashboard/campaigns/hierarchy");
      if (res1.ok) return await res1.json();

      const res2 = await fetch("/api/dashboard/campaigns");
      if (!res2.ok) throw new Error("Falha ao carregar campanhas");
      return await res2.json();
    },
    retry: 1,
    staleTime: 30_000,
  });

  const campaigns = useMemo(() => normalizeHierarchy(data), [data]);

  const filteredCampaigns = useMemo(() => {
    const q = search.trim().toLowerCase();

    return campaigns.filter((c) => {
      const name = (c.name || "").trim().toLowerCase();

      // 🚫 Ignora campanhas chamadas "Fale Conosco"
      if (name === "fale conosco") return false;
      
      const status = normalizeStatus(c);
      const platform = (c.platform || "").toLowerCase();

      const matchesSearch =
        !q ||
        (c.name || "").toLowerCase().includes(q) ||
        String(c.id).toLowerCase().includes(q) ||
        // procura também dentro de adsets/ads (pra achar rápido)
        (c.adsets || []).some((as) => {
          if ((as.name || "").toLowerCase().includes(q)) return true;
          if (String(as.id).toLowerCase().includes(q)) return true;
          return (as.ads || []).some((ad) => (ad.name || "").toLowerCase().includes(q) || String(ad.id).toLowerCase().includes(q));
        });

      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesPlatform = platformFilter === "all" || platform === platformFilter;

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [campaigns, search, statusFilter, platformFilter]);

  const selectedCampaign: Campaign | null = useMemo(() => {
    const fallback = filteredCampaigns[0] || null;
    const found = selectedCampaignId
      ? filteredCampaigns.find((c) => c.id === selectedCampaignId) || null
      : null;

    return found || fallback;
  }, [filteredCampaigns, selectedCampaignId]);

  const adsetsForSelected = useMemo(() => selectedCampaign?.adsets || [], [selectedCampaign]);

  const selectedAdset: Adset | null = useMemo(() => {
    if (!selectedCampaign) return null;
    const list = selectedCampaign.adsets || [];
    const found = selectedAdsetId ? list.find((a) => a.id === selectedAdsetId) || null : null;
    return found || list[0] || null;
  }, [selectedCampaign, selectedAdsetId]);

  const adsForSelected = useMemo(() => {
    if (!selectedCampaign) return [];
    if (selectedAdsetId) {
      const as = (selectedCampaign.adsets || []).find((x) => x.id === selectedAdsetId);
      return as?.ads || [];
    }
    // se nenhum conjunto selecionado, mostra todos
    const all = (selectedCampaign.adsets || []).flatMap((a) => a.ads || []);
    return all;
  }, [selectedCampaign, selectedAdsetId]);

  const calculateCampaignValue = (filteredCampaigns: Campaign[]): number | string=> {
    // Soma revenue válido
    const revenue = filteredCampaigns.reduce(
      (acc, campaign) =>
        acc + (Number(campaign?.revenue ?? 0) > 0 ? Number(campaign.revenue) : 0),
      0
    );

    // Soma spend válido
    const totalSpend = filteredCampaigns.reduce((acc, campaign) => {
      const spend = toNumber(campaign.spend ?? 0);
      if (spend !== 0) {
        return acc + spend;
      }
      return acc;
    }, 0);

    const fixedBase = 1500 + 2000 + 1500;

    if (revenue > 0) {
      const revenueReturn = (revenue - (fixedBase + totalSpend)) / (fixedBase + totalSpend) * 100;
      return revenueReturn.toFixed(2);
    }

    return "—";
  }

  const sortedAds = useMemo(() => {
    const arr = [...adsForSelected];

    const cmp = (a: Ad, b: Ad) => {
      if (adsSort === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      if (adsSort === "clicks") return (b.clicks_last_30d || 0) - (a.clicks_last_30d || 0);
      if (adsSort === "cpa") return toNumber(a.cpa) - toNumber(b.cpa); // menor CPA primeiro
      // spend (default): maior spend primeiro
      return toNumber(b.spend) - toNumber(a.spend);
    };

    arr.sort(cmp);
    return arr;
  }, [adsForSelected, adsSort]);

  const topStats = useMemo(() => {
    const list = filteredCampaigns;
    const totalSpend = list.reduce((sum, c) => sum + toNumber(c.spend), 0);
    const totalLeads = list.reduce((sum, c) => sum + (c.leads || 0), 0);
    const totalClicks = list.reduce((sum, c) => sum + (c.clicks_last_30d || 0), 0);
    const totalImpr = list.reduce((sum, c) => sum + (c.impressions_last_30d || 0), 0);

    const avgCpaClick = totalClicks > 0 ? totalSpend / totalClicks : null;
    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : null;

    return { totalSpend, totalLeads, totalClicks, totalImpr, avgCpaClick, avgCpl };
  }, [filteredCampaigns]);

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Atualizado",
      description: "Campanhas, conjuntos e anúncios atualizados.",
    });
  };

  const cStatus = selectedCampaign ? normalizeStatus(selectedCampaign) : "UNKNOWN";
  const cpl = selectedCampaign ? computeCPL(selectedCampaign.spend, selectedCampaign.leads) : null;

  function calculateROAS(filteredCampaigns: Campaign[]): React.ReactNode {
    const totalSpend = filteredCampaigns.reduce((sum, c) => sum + toNumber(c.spend), 0);
    const totalRevenue = filteredCampaigns.reduce((sum, c) => sum + toNumber(c.revenue ?? 0), 0);

    if (totalSpend === 0) return "—";
    
    const roas = totalRevenue / totalSpend;
    return roas.toFixed(2);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-gray-500">
            Visual estilo “Ads Manager”, só que feito pra gestor bater o olho e decidir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Gasto geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moneyBRL(topStats.totalSpend)}</div>
            <p className="text-xs text-muted-foreground">Somatório do recorte atual</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Valor das Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moneyBRL(filteredCampaigns.reduce((sum, c) => sum + toNumber(c.revenue ?? 0), 0))}</div>
            <p className="text-xs text-muted-foreground">Valor das vendas ganhas</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateCampaignValue(filteredCampaigns)}</div>
            <p className="text-xs text-muted-foreground">ROI do recorte atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              ROAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateROAS(filteredCampaigns)}</div>
            <p className="text-xs text-muted-foreground">ROAS do recorte atual</p>
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Campanhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCampaigns.length}</div>
            <p className="text-xs text-muted-foreground">No filtro atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: campaigns list */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5" />
                  Campanhas
                </CardTitle>
                <CardDescription>
                  Clique numa campanha pra ver conjuntos e anúncios.
                </CardDescription>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome/ID/adset/ad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Ativa</SelectItem>
                    <SelectItem value="PAUSED">Pausada</SelectItem>
                    <SelectItem value="ARCHIVED">Arquivada</SelectItem>
                    <SelectItem value="DELETED">Deletada</SelectItem>
                    <SelectItem value="UNKNOWN">Indefinida</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="meta">Meta Ads</SelectItem>
                    <SelectItem value="meta_ads">Meta Ads (legacy)</SelectItem>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="tiktok_ads">TikTok Ads</SelectItem>
                    <SelectItem value="linkedin_ads">LinkedIn Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Separator />
            <ScrollArea className="h-[560px]">
              <div className="p-2">
                {isLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">Carregando…</div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Nada aqui com esses filtros 😅
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCampaigns.map((c) => {
                      const status = normalizeStatus(c);
                      const selected = selectedCampaign?.id === c.id;

                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCampaignId(c.id);
                            setSelectedAdsetId(null);
                          }}
                          className={[
                            "w-full text-left rounded-xl border p-3 transition",
                            selected
                              ? "border-primary/40 bg-primary/5 shadow-sm"
                              : "hover:bg-muted/40",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {c.name || "—"}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                ID: <span className="font-mono">{c.id}</span> •{" "}
                                {platformLabel(c.platform)}
                              </div>
                            </div>

                            <Badge
                              variant="outline"
                              className={[
                                "shrink-0 border",
                                statusBadgeClass(status),
                              ].join(" ")}
                            >
                              {statusLabel(status)}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: details */}
        <Card className="lg:col-span-8">
          <CardHeader>
            {selectedCampaign ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-xl truncate">{selectedCampaign.name || "—"}</CardTitle>
                    <CardDescription className="truncate">
                      ID: <span className="font-mono">{selectedCampaign.id}</span> •{" "}
                      {platformLabel(selectedCampaign.platform)} • Atualizado:{" "}
                      {safeDateBR(selectedCampaign.updated_at || selectedCampaign.created_at)}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={["border", statusBadgeClass(cStatus)].join(" ")}
                    >
                      {statusLabel(cStatus)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Gasto
                    </div>
                    <div className="text-lg font-semibold mt-1">{moneyBRL(selectedCampaign.spend)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <CardTitle>Selecione uma campanha</CardTitle>
                <CardDescription>Escolha uma campanha na coluna da esquerda.</CardDescription>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {!selectedCampaign ? null : (
              <Tabs defaultValue="adsets" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <TabsList className="w-full md:w-auto">
                    <TabsTrigger value="adsets" className="gap-2">
                      <Layers className="w-4 h-4" /> Conjuntos
                    </TabsTrigger>
                    <TabsTrigger value="ads" className="gap-2">
                      <Megaphone className="w-4 h-4" /> Anúncios
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground hidden md:block">
                      Dica: ordene anúncios pra achar “campeão” e “vilão” rápido.
                    </div>
                    <Select value={adsSort} onValueChange={(v) => setAdsSort(v as SortKey)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ordenar anúncios" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spend">Maior gasto</SelectItem>
                        <SelectItem value="clicks">Mais cliques</SelectItem>
                        <SelectItem value="cpa">Menor CPA</SelectItem>
                        <SelectItem value="name">Nome (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TabsContent value="adsets" className="mt-4">
                  <Card className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Conjuntos de anúncios</CardTitle>
                      <CardDescription>
                        Clique em um conjunto para ver só os anúncios dele (ou veja todos na aba Anúncios).
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Conjunto</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Gasto</TableHead>
                            <TableHead className="text-right">CPA</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(adsetsForSelected || []).map((as) => {
                            const st = normalizeStatus(as);
                            const isSelected = selectedAdset?.id === as.id;

                            return (
                              <TableRow
                                key={as.id}
                                className={["cursor-pointer", isSelected ? "bg-primary/5" : "hover:bg-muted/30"].join(" ")}
                                onClick={() => setSelectedAdsetId(as.id)}
                              >
                                <TableCell className="min-w-[320px]">
                                  <div className="font-medium">{as.name || "—"}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ID: <span className="font-mono">{as.id}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={["border", statusBadgeClass(st)].join(" ")}>
                                    {statusLabel(st)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">{moneyBRL(as.spend)}</TableCell>
                                <TableCell className="text-right">{as.cpa ? moneyBRL(as.cpa) : "—"}</TableCell>
                              </TableRow>
                            );
                          })}

                          {(adsetsForSelected || []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                Nenhum conjunto encontrado para essa campanha.
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowUpDown className="w-4 h-4" />
                    Selecionado:{" "}
                    <span className="font-medium text-foreground">
                      {selectedAdset ? selectedAdset.name : "—"}
                    </span>{" "}
                    • Anúncios nesse conjunto:{" "}
                    <span className="font-medium text-foreground">{(selectedAdset?.ads || []).length}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setSelectedAdsetId(null)}
                    >
                      Ver todos os anúncios
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="ads" className="mt-4">
                  <Card className="border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Anúncios</CardTitle>
                      <CardDescription>
                        Ranking prático: dá pra achar o “campeão” (baixo CPA / bom volume) e o “vilão” (alto gasto e pouco retorno).
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Anúncio</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Gasto</TableHead>
                            <TableHead className="text-right">CPA</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedAds.map((ad) => {
                            const st = normalizeStatus(ad);
                            return (
                              <TableRow key={ad.id} className="hover:bg-muted/30">
                                <TableCell className="min-w-[360px]">
                                  <div className="font-medium">{ad.name || "—"}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ID: <span className="font-mono">{ad.id}</span>
                                    {ad.adset_id || ad.adsetId ? (
                                      <>
                                        {" "}• Adset:{" "}
                                        <span className="font-mono">
                                          {String(ad.adset_id ?? ad.adsetId)}
                                        </span>
                                      </>
                                    ) : null}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={["border", statusBadgeClass(st)].join(" ")}>
                                    {statusLabel(st)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">{moneyBRL(ad.spend)}</TableCell>
                                <TableCell className="text-right">{ad.cpa ? moneyBRL(ad.cpa) : "—"}</TableCell>
                              </TableRow>
                            );
                          })}

                          {sortedAds.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                Nenhum anúncio encontrado. Se o endpoint hierarchy estiver ok, isso normalmente significa campanha sem ads.
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
