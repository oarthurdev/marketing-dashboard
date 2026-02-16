import { db } from './db';
import { eq, desc, avg } from 'drizzle-orm';
import { 
  metrics, campaigns, ads, adsets, activities, apiConnections, reports, leadStageCounts, LeadStageCount, leadClosingTime,
  type Metrics, type InsertMetrics, 
  type Campaign, type InsertCampaign,
  type Activity, type InsertActivity,
  type ApiConnection, type InsertApiConnection,
  type Report, type InsertReport,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { makeRequest } from './services/kommo';

type CampaignRow = any; // ou tipa melhor se quiser
type AdsetRow = any;
type AdRow = any;

type CampaignHierarchy = CampaignRow & {
  adsets: Array<
    AdsetRow & {
      ads: AdRow[];
    }
  >;
};

type PipelineSummary = {
  pipelineId: number;
  pipelineName: string;
};

const RATE_LIMIT_MS = 1000 / 7;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface IStorage {
  // Metrics
  getMetrics(limit?: number): Promise<Metrics[]>;
  getLatestMetrics(): Promise<Metrics | undefined>;
  createMetrics(metrics: InsertMetrics): Promise<Metrics>;

  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaignById(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined>;

  // Activities
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // API Connections
  getApiConnections(): Promise<ApiConnection[]>;
  getApiConnectionByPlatform(platform: string): Promise<ApiConnection | undefined>;
  createApiConnection(connection: InsertApiConnection): Promise<ApiConnection>;
  updateApiConnection(platform: string, updates: Partial<InsertApiConnection>): Promise<ApiConnection | undefined>;

  // Reports
  getReports(limit?: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
}

// Hybrid storage that tries database first, falls back to memory
class HybridStorage implements IStorage {
  private memoryMetrics = new Map<string, Metrics>();
  private memoryCampaigns = new Map<string, Campaign>();
  private memoryActivities = new Map<string, Activity>();
  private memoryApiConnections = new Map<string, ApiConnection>();
  private memoryReports = new Map<string, Report>();
  private memoryStageCounts = new Map<number, LeadStageCount[]>();
  private pipelinesCache: PipelineSummary[] | null = null;
  private pipelinesCacheAt: number | null = null
  private memoryAvgClosingTimeByPipeline = new Map<number, number>();
  private memoryAvgClosingTime = 0;
  private isDatabaseAvailable = true;

  constructor() {
    this.initializeDefaults();
  }

  private async initializeDefaults() {
    try {
      // Test database connection
      await db.select().from(apiConnections).limit(1);
      console.log('✓ Database connected successfully');

      // Initialize default connections in database
      const existingConnections = await db.select().from(apiConnections).limit(1);

      if (existingConnections.length === 0) {
        const defaultConnections: InsertApiConnection[] = [
          { platform: 'hubspot', isConnected: false, lastSync: null, config: {} },
          { platform: 'google_ads', isConnected: false, lastSync: null, config: {} },
          { platform: 'shopify', isConnected: false, lastSync: null, config: {} },
          { platform: 'meta_ads', isConnected: false, lastSync: null, config: {} },
          { platform: 'tiktok_ads', isConnected: false, lastSync: null, config: {} },
          { platform: 'kommo', isConnected: false, lastSync: null, config: {} }
        ];

        await db.insert(apiConnections).values(defaultConnections);
      }

      this.isDatabaseAvailable = true;
    } catch (error) {
      console.log('⚠ Database unavailable, using memory storage:', error.message);
      this.isDatabaseAvailable = false;
      this.initializeMemoryDefaults();
    }
  }

  private initializeMemoryDefaults() {
    const defaultConnections: InsertApiConnection[] = [
      { platform: 'hubspot', isConnected: false, lastSync: null, config: {} },
      { platform: 'google_ads', isConnected: false, lastSync: null, config: {} },
      { platform: 'shopify', isConnected: false, lastSync: null, config: {} },
      { platform: 'meta_ads', isConnected: false, lastSync: null, config: {} },
      { platform: 'tiktok_ads', isConnected: false, lastSync: null, config: {} },
      { platform: 'kommo', isConnected: false, lastSync: null, config: {} }
    ];

    defaultConnections.forEach(conn => {
      const id = randomUUID();
      const connection: ApiConnection = {
        id,
        platform: conn.platform,
        isConnected: conn.isConnected || false,
        lastSync: conn.lastSync || null,
        config: conn.config || {}
      };
      this.memoryApiConnections.set(id, connection);
    });
  }

  // Metrics methods
  async getMetrics(limit: number = 30): Promise<Metrics[]> {
    if (this.isDatabaseAvailable) {
      try {
        return await db
          .select()
          .from(metrics)
          .orderBy(desc(metrics.date))
          .limit(limit);
      } catch (error) {
        console.error('Database error, falling back to memory:', error);
        this.isDatabaseAvailable = false;
      }
    }

    return Array.from(this.memoryMetrics.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  // 🔹 Leads por etapa (pipeline)
  async getLeadsByStage(
    pipelineId: number
  ): Promise<LeadStageCount[]> {
    if (this.isDatabaseAvailable) {
      try {
        return await db
          .select()
          .from(leadStageCounts)
          .where(eq(leadStageCounts.pipelineId, pipelineId))
          .orderBy(leadStageCounts.stageId);
      } catch (error) {
        console.error("DB error (getLeadsByStage):", error);
        this.isDatabaseAvailable = false;
      }
    }

    return this.memoryStageCounts.get(pipelineId) ?? [];
  }

  async getAllPipelines(): Promise<PipelineSummary[]> {
    if (this.isDatabaseAvailable) {
      try {
        const rows = await db
          .select({
            pipelineId: leadStageCounts.pipelineId,
            pipelineName: leadStageCounts.pipelineName,
          })
          .from(leadStageCounts)
          .groupBy(
            leadStageCounts.pipelineId,
            leadStageCounts.pipelineName
          )
          .orderBy(leadStageCounts.pipelineName);

        return rows;
      } catch (error) {
        console.error(
          "Database error on getAllPipelines, falling back to memory:",
          error
        );
        this.isDatabaseAvailable = false;
      }
    }

    // 🧠 fallback em memória
    const pipelinesMap = new Map<number, PipelineSummary>();

    Array.from(this.memoryStageCounts.values()).forEach(items => {
      items.forEach(item => {
        if (!pipelinesMap.has(item.pipelineId)) {
          pipelinesMap.set(item.pipelineId, {
            pipelineId: item.pipelineId,
            pipelineName: item.pipelineName,
          });
        }
      });
    });

    return Array.from(pipelinesMap.values()).sort((a, b) =>
      a.pipelineName.localeCompare(b.pipelineName)
    );
  }

  // 🔹 Média de tempo de fechamento
  async getAverageClosingTime(
    pipelineId?: number
  ): Promise<number> {
    if (this.isDatabaseAvailable) {
      try {
        let query = db
          .select({
            avgClosingDays: avg(leadClosingTime.closingDays),
          })
          .from(leadClosingTime);

        // 🎯 reatribuição obrigatória no Drizzle
        if (pipelineId !== undefined) {
          query = query.where(
            eq(leadClosingTime.pipelineId, pipelineId)
          );
        }

        const result = await query;

        return Number(result[0]?.avgClosingDays ?? 0);
      } catch (error) {
        console.error(
          "DB error (getAverageClosingTime), falling back to memory:",
          error
        );
        this.isDatabaseAvailable = false;
      }
    }

    // 🧠 fallback em memória
    if (
      pipelineId !== undefined &&
      this.memoryAvgClosingTimeByPipeline?.has(pipelineId)
    ) {
      return this.memoryAvgClosingTimeByPipeline.get(pipelineId)!;
    }

    return this.memoryAvgClosingTime ?? 0;
  }

  // 🔹 (Opcional) salvar cache em memória
  setMemoryLeadsByStage(
    pipelineId: number,
    data: LeadStageCount[]
  ) {
    this.memoryStageCounts.set(pipelineId, data);
  }

    setMemoryAverageClosingTime(
      avg: number,
      pipelineId?: number
    ) {
      if (pipelineId) {
        this.memoryAvgClosingTimeByPipeline.set(pipelineId, avg);
      } else {
        this.memoryAvgClosingTime = avg;
      }
    }
  
  async getLatestMetrics(): Promise<Metrics | undefined> {
    if (this.isDatabaseAvailable) {
      try {
        const results = await db
          .select()
          .from(metrics)
          .orderBy(desc(metrics.date))
          .limit(1);
        return results[0];
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    const allMetrics = Array.from(this.memoryMetrics.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return allMetrics[0];
  }

  async createMetrics(insertMetrics: InsertMetrics): Promise<Metrics> {
    if (this.isDatabaseAvailable) {
      try {
        const results = await db
          .insert(metrics)
          .values(insertMetrics)
          .returning();
        return results[0];
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    const id = randomUUID();
    const metric: Metrics = {
      id,
      date: insertMetrics.date || new Date(),
      totalLeads: insertMetrics.totalLeads || 0,
      conversionRate: insertMetrics.conversionRate || "0.00",
      dailyRevenue: insertMetrics.dailyRevenue || "0.00",
      avgCPA: insertMetrics.avgCPA || "0.00",
      leadSources: insertMetrics.leadSources || {},
      createdAt: new Date()
    };
    this.memoryMetrics.set(id, metric);
    return metric;
  }

  // API Connections methods
  async getApiConnections(): Promise<ApiConnection[]> {
    if (this.isDatabaseAvailable) {
      try {
        return await db.select().from(apiConnections);
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    return Array.from(this.memoryApiConnections.values());
  }

  async getApiConnectionByPlatform(platform: string): Promise<ApiConnection | undefined> {
    if (this.isDatabaseAvailable) {
      try {
        const results = await db
          .select()
          .from(apiConnections)
          .where(eq(apiConnections.platform, platform));
        return results[0];
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    return Array.from(this.memoryApiConnections.values())
      .find(conn => conn.platform === platform);
  }

  async createApiConnection(insertConnection: InsertApiConnection): Promise<ApiConnection> {
    if (this.isDatabaseAvailable) {
      try {
        const results = await db
          .insert(apiConnections)
          .values(insertConnection)
          .returning();
        return results[0];
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    const id = randomUUID();
    const connection: ApiConnection = {
      id,
      platform: insertConnection.platform,
      isConnected: insertConnection.isConnected || false,
      lastSync: insertConnection.lastSync || null,
      config: insertConnection.config || {}
    };
    this.memoryApiConnections.set(id, connection);
    return connection;
  }

  async updateApiConnection(platform: string, updates: Partial<InsertApiConnection>): Promise<ApiConnection | undefined> {
    if (this.isDatabaseAvailable) {
      try {
        const results = await db
          .update(apiConnections)
          .set(updates)
          .where(eq(apiConnections.platform, platform))
          .returning();
        return results[0];
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    const connection = Array.from(this.memoryApiConnections.values())
      .find(conn => conn.platform === platform);

    if (connection) {
      Object.assign(connection, updates);
      this.memoryApiConnections.set(connection.id, connection);
      return connection;
    }

    return undefined;
  }

  // Campaigns methods
  async getCampaigns(): Promise<Campaign[]> {
    if (this.isDatabaseAvailable) {
      try {
        return await db.select().from(campaigns);
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    return Array.from(this.memoryCampaigns.values());
  }

  async getLeadsByStageCurrentMonth(stageId: string): Promise<Lead[]> {
    const all: Lead[] = [];
    let page = 1;

    const now = new Date();

    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime() / 1000;

    while (true) {
      const start = Date.now();

      const query = `
        filter[statuses][0][pipeline_id]=11795444
        &filter[statuses][0][status_id]=${stageId}
        &filter[created_at][from]=${Math.floor(firstDay)}
        &filter[created_at][to]=${Math.floor(lastDay)}
      `.replace(/\s/g, "");

      const res = await makeRequest(`/leads?${query}&page=${page}&limit=250`);
      const leads = res?._embedded?.leads ?? [];

      console.log(`📥 Página ${page}: ${leads.length}`);

      if (!leads.length) break;

      all.push(...leads);

      if (leads.length < 250) break;
      page++;

      const elapsed = Date.now() - start;
      if (elapsed < RATE_LIMIT_MS) {
        await sleep(RATE_LIMIT_MS - elapsed);
      }
    }

    console.log("✅ Total leads mês atual:", all.length);
    return all;
  }

  async getCampaignsHierarchy() {
    if (this.isDatabaseAvailable) {
      try {
        const [campaignRows, adsetRows, adRows] = await Promise.all([
          db.select().from(campaigns),
          db.select().from(adsets),
          db.select().from(ads),
        ]);

        // Normaliza camelCase -> snake_case (só os campos chave)
        const campaignsOut = campaignRows.map((c: any) => ({
          ...c,
          // garante id string
          id: String(c.id),
        }));

        const adsetsOut = adsetRows.map((a: any) => ({
          ...a,
          id: String(a.id),
          campaign_id: String(a.campaign_id ?? a.campaignId),
        }));

        const adsOut = adRows.map((ad: any) => ({
          ...ad,
          id: String(ad.id),
          campaign_id: String(ad.campaign_id ?? ad.campaignId),
          adset_id: String(ad.adset_id ?? ad.adsetId),
        }));

        return {
          campaigns: campaignsOut,
          adsets: adsetsOut,
          ads: adsOut,
        };
      } catch (e) {
        this.isDatabaseAvailable = false;
      }
    }

    // fallback (sem DB): devolve só campaigns sem árvore
    const campaignsMem = Array.from(this.memoryCampaigns.values());
    return { campaigns: campaignsMem, adsets: [], ads: [] };
  }

  async getCampaignById(id: string): Promise<Campaign | undefined> {
    if (this.isDatabaseAvailable) {
      try {
        const results = await db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, id));
        return results[0];
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    return this.memoryCampaigns.get(id);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    if (this.isDatabaseAvailable) {
      try {
        const results = await db
          .insert(campaigns)
          .values(insertCampaign)
          .returning();
        return results[0];
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    const id = randomUUID();
    const campaign: Campaign = {
      id,
      name: insertCampaign.name,
      platform: insertCampaign.platform,
      leads: insertCampaign.leads || 0,
      spend: insertCampaign.spend || "0.00",
      roi: insertCampaign.roi || "0.00",
      status: insertCampaign.status || "active",
      startDate: insertCampaign.startDate,
      endDate: insertCampaign.endDate || null,
      createdAt: new Date()
    };
    this.memoryCampaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    if (this.isDatabaseAvailable) {
      try {
        const results = await db
          .update(campaigns)
          .set(updates)
          .where(eq(campaigns.id, id))
          .returning();
        return results[0];
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    const campaign = this.memoryCampaigns.get(id);
    if (campaign) {
      Object.assign(campaign, updates);
      this.memoryCampaigns.set(id, campaign);
      return campaign;
    }

    return undefined;
  }

  async getDashboard(days: number) {
    // 🔥 Ajuste isso conforme os dados que você já retorna hoje no /api/dashboard.
    // A ideia é manter o formato que o front espera.

    const campaigns = await this.getCampaigns();

    // métricas básicas derivadas do que você já tem
    const totalCampaigns = campaigns.length;

    // exemplos (ajuste se seu sistema tem leads em outra tabela)
    const totalLeads = campaigns.reduce((acc, c: any) => acc + Number(c.leads ?? 0), 0);
    const totalSpend = campaigns.reduce((acc, c: any) => acc + Number(c.spend ?? 0), 0);

    // funil (por enquanto usando o que o sistema já tem = leads em campaigns)
    // depois você pluga oportunidades/visitas/reserva/venda quando tiver origem
    const funnel = {
      leads: totalLeads,
      opportunities: 0,
      visits: 0,
      reservations: 0,
      sales: 0,
    };

    return {
      totalCampaigns,
      totalLeads,
      totalSpend,
      funnel,
      campaignsPreview: campaigns.slice(0, 10),
      days,
      updatedAt: new Date().toISOString(),
    };
  }

  // Activities methods
  async getRecentActivities(limit: number = 20): Promise<Activity[]> {
    if (this.isDatabaseAvailable) {
      try {
        return await db
          .select()
          .from(activities)
          .orderBy(desc(activities.timestamp))
          .limit(limit);
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    return Array.from(this.memoryActivities.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    if (this.isDatabaseAvailable) {
      try {
        const results = await db
          .insert(activities)
          .values(insertActivity)
          .returning();
        return results[0];
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    const id = randomUUID();
    const activity: Activity = {
      id,
      type: insertActivity.type,
      source: insertActivity.source,
      details: insertActivity.details,
      amount: insertActivity.amount || null,
      timestamp: new Date()
    };
    this.memoryActivities.set(id, activity);
    return activity;
  }

  // Reports methods
  async getReports(limit: number = 10): Promise<Report[]> {
    if (this.isDatabaseAvailable) {
      try {
        return await db
          .select()
          .from(reports)
          .orderBy(desc(reports.generatedAt))
          .limit(limit);
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    return Array.from(this.memoryReports.values())
      .sort((a, b) => new Date(b.generatedAt!).getTime() - new Date(a.generatedAt!).getTime())
      .slice(0, limit);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    if (this.isDatabaseAvailable) {
      try {
        const results = await db
          .insert(reports)
          .values(insertReport)
          .returning();
        return results[0];
      } catch (error) {
        this.isDatabaseAvailable = false;
      }
    }

    const id = randomUUID();
    const report: Report = {
      id,
      title: insertReport.title,
      type: insertReport.type,
      format: insertReport.format,
      data: insertReport.data || {},
      generatedAt: new Date()
    };
    this.memoryReports.set(id, report);
    return report;
  }
}

export const storage = new HybridStorage();