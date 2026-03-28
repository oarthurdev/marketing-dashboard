import { db } from './db';
import { eq, desc, avg, sql, and, gte, lt } from 'drizzle-orm';
import { 
  metrics, campaigns, ads, adsets, activities, apiConnections, reports, leadStageCounts, LeadStageCount, leadClosingTime,
  type Metrics, type InsertMetrics, 
  type Campaign, type InsertCampaign,
  type Activity, type InsertActivity,
  type ApiConnection, type InsertApiConnection,
  type Report, type InsertReport,
  leadResponseTimes,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { makeRequest } from './services/kommo';

type CampaignRow = any; // ou tipa melhor se quiser
type AdsetRow = any;
type AdRow = any;

type LeadResponseTimesSums = {
  monthStart: string;
  monthEnd: string;
  totalRowsHuman: number;
  totalRowsAi: number;
  sumResponseTimeHuman: number;
  sumResponseTimeAi: number;
};

type CampaignHierarchy = CampaignRow & {
  adsets: Array<
    AdsetRow & {
      ads: AdRow[];
    }
  >;
};

type TagCount = {
  tag: string;
  total: number;
};

export type Period = "all" | "daily" | "weekly" | "monthly";

type PipelineSummary = {
  pipelineId: number;
  pipelineName: string;
};

type KommoLeadLite = {
  id: number;
  created_at?: number;
  status_id?: number;
};

const RATE_LIMIT_MS = 1000 / 7;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractRows<T = any>(result: any): T[] {
  if (Array.isArray(result)) return result as T[];
  if (Array.isArray(result?.rows)) return result.rows as T[];
  return [];
}

function normalizeMonthKey(value: any): string | null {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}$/.test(value)) return value;
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 7);

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
    }
  }

  return null;
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
  memoryLeads: Map<string, any> = new Map();

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
  
  async getLeadResponseTimesSumsCurrentMonth(): Promise<LeadResponseTimesSums> {
    const now = new Date();

    const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthStart = monthStartDate.toISOString();
    const monthEnd = monthEndDate.toISOString();

    const result = await db
      .select({
        // total por tipo
        totalRowsHuman: sql<number>`
          count(*) filter (
            where ${leadResponseTimes.responseTimeHuman} is not null
              and ${leadResponseTimes.responseTimeHuman} <> 0
          )::int
        `,
        totalRowsAi: sql<number>`
          count(*) filter (
            where ${leadResponseTimes.responseTimeAi} is not null
              and ${leadResponseTimes.responseTimeAi} <> 0
          )::int
        `,

        // soma por tipo
        sumResponseTimeHuman: sql<number>`
          coalesce(sum(
            case
              when ${leadResponseTimes.responseTimeHuman} is not null
                and ${leadResponseTimes.responseTimeHuman} <> 0
              then ${leadResponseTimes.responseTimeHuman}
              else 0
            end
          ), 0)::int
        `,
        sumResponseTimeAi: sql<number>`
          coalesce(sum(
            case
              when ${leadResponseTimes.responseTimeAi} is not null
                and ${leadResponseTimes.responseTimeAi} <> 0
              then ${leadResponseTimes.responseTimeAi}
              else 0
            end
          ), 0)::int
        `,
      })
      .from(leadResponseTimes)
      .where(
        and(
          gte(leadResponseTimes.leadCreatedAt, monthStart),
          lt(leadResponseTimes.leadCreatedAt, monthEnd),

          gte(leadResponseTimes.firstResponseAt, monthStart),
          lt(leadResponseTimes.firstResponseAt, monthEnd),

          gte(leadResponseTimes.firstResponseAt, leadResponseTimes.leadCreatedAt),

          eq(
            sql`date_trunc('month', ${leadResponseTimes.firstResponseAt})`,
            sql`date_trunc('month', ${leadResponseTimes.leadCreatedAt})`
          )
        )
      );

    const row = result[0] ?? {
      totalRowsHuman: 0,
      totalRowsAi: 0,
      sumResponseTimeHuman: 0,
      sumResponseTimeAi: 0,
    };

    return {
      monthStart,
      monthEnd,
      totalRowsHuman: row.totalRowsHuman ?? 0,
      totalRowsAi: row.totalRowsAi ?? 0,
      sumResponseTimeHuman: row.sumResponseTimeHuman ?? 0,
      sumResponseTimeAi: row.sumResponseTimeAi ?? 0,
    };
  }

  async getTagCounts(period: Period): Promise<TagCount[]> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    if (period === "all") {
      if (this.isDatabaseAvailable) {
        try {
          const result = await db.execute(sql<TagCount>`
            SELECT
              tag->>'name' AS tag,
              COUNT(DISTINCT lead_id)::int AS total
            FROM kommo_leads
            JOIN LATERAL jsonb_array_elements(COALESCE(tags_json, '[]'::jsonb)) AS tag ON TRUE
            WHERE COALESCE(tag->>'name', '') <> ''
              AND is_deleted = false
            GROUP BY tag->>'name'
            ORDER BY total DESC, tag->>'name' ASC;
          `);

          return extractRows<TagCount>(result);
        } catch (error) {
          console.error("Error fetching tag counts:", error);
          this.isDatabaseAvailable = false;
        }
      }

      const counts = new Map<string, number>();
      for (const lead of this.memoryLeads.values()) {
        const tags = Array.isArray(lead?.tags)
          ? lead.tags
          : Array.isArray(lead?.tags_json)
          ? lead.tags_json
          : [];

        for (const tag of tags) {
          const name = String(tag?.name ?? '').trim();
          if (!name) continue;
          counts.set(name, (counts.get(name) ?? 0) + 1);
        }
      }

      return Array.from(counts.entries())
        .map(([tag, total]) => ({ tag, total }))
        .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag));
    }

    return this.getTagCountsByMonth(currentMonth);
  }

  async getTagCountsByMonth(month: string): Promise<TagCount[]> {
    const forAll = month === 'all';

    if (this.isDatabaseAvailable) {
      try {
        const result = await db.execute(sql<TagCount>`
          SELECT
            tag->>'name' AS tag,
            COUNT(DISTINCT lead_id)::int AS total
          FROM kommo_leads
          JOIN LATERAL jsonb_array_elements(COALESCE(tags_json, '[]'::jsonb)) AS tag ON TRUE
          WHERE is_deleted = false
            ${forAll ? sql`` : sql`AND year_ref = split_part(${month}, '-', 1)::int AND month_num = split_part(${month}, '-', 2)::int`}
            AND COALESCE(tag->>'name', '') <> ''
          GROUP BY tag->>'name'
          ORDER BY total DESC, tag->>'name' ASC;
        `);

        return extractRows<TagCount>(result);
      } catch (error) {
        console.error("Error fetching tag counts by month:", error);
        this.isDatabaseAvailable = false;
      }
    }

    const counts = new Map<string, number>();
    const forAll = month === 'all';

    for (const lead of this.memoryLeads.values()) {
      const leadMonth = normalizeMonthKey(lead?.month_ref) ?? normalizeMonthKey(lead?.created_at);
      if (!forAll && leadMonth !== month) continue;
      if (lead?.is_deleted) continue;

      const tags = Array.isArray(lead?.tags)
        ? lead.tags
        : Array.isArray(lead?.tags_json)
        ? lead.tags_json
        : [];

      for (const tag of tags) {
        const name = String(tag?.name ?? '').trim();
        if (!name) continue;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([tag, total]) => ({ tag, total }))
      .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag));
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

  async getLeadsByStageCurrentMonth(stageId: string): Promise<KommoLeadLite[]> {
    const all: KommoLeadLite[] = [];
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

  async getFunnelByMonth(month: string): Promise<{
    leads: number;
    opportunities: number;
    visitsA: number;
    visitsR: number;
    reservations: number;
    sales: number;
  }> {
    const forAll = month === 'all';

    if (this.isDatabaseAvailable) {
      try {
        const OPPORTUNITY_MATCH = "oportunidade";
        const VISIT_SCHEDULED_STATUS_IDS = [90926003];
        const VISIT_DONE_STATUS_IDS = [94531847];
        const RESERVATION_STATUS_IDS = [96470303];
        const SALES_STATUS_IDS = [142];

        const result = await db.execute(sql<{
          leads: number;
          opportunities: number;
          "visitsA": number;
          "visitsR": number;
          reservations: number;
          sales: number;
        }>`
          SELECT
            COUNT(DISTINCT lead_id)::int AS leads,
            COUNT(DISTINCT lead_id) FILTER (
              WHERE EXISTS (
                SELECT 1
                FROM jsonb_array_elements(COALESCE(tags_json, '[]'::jsonb)) AS tag
                WHERE position(lower(${OPPORTUNITY_MATCH}) in lower(COALESCE(tag->>'name', ''))) > 0
              )
            )::int AS "opportunities",
            COUNT(DISTINCT lead_id) FILTER (
              WHERE status_id = ANY(${VISIT_SCHEDULED_STATUS_IDS}::int[])
            )::int AS "visitsA",
            COUNT(DISTINCT lead_id) FILTER (
              WHERE status_id = ANY(${VISIT_DONE_STATUS_IDS}::int[])
            )::int AS "visitsR",
            COUNT(DISTINCT lead_id) FILTER (
              WHERE status_id = ANY(${RESERVATION_STATUS_IDS}::int[])
            )::int AS reservations,
            COUNT(DISTINCT lead_id) FILTER (
              WHERE status_id = ANY(${SALES_STATUS_IDS}::int[])
            )::int AS sales
          FROM kommo_leads
          WHERE is_deleted = false
            ${forAll ? sql`` : sql`AND year_ref = split_part(${month}, '-', 1)::int AND month_num = split_part(${month}, '-', 2)::int`};
        `);

        const row = extractRows<any>(result)[0] ?? {};

        return {
          leads: Number(row.leads ?? 0),
          opportunities: Number(row.opportunities ?? 0),
          visitsA: Number(row.visitsA ?? row.visitsa ?? 0),
          visitsR: Number(row.visitsR ?? row.visitsr ?? 0),
          reservations: Number(row.reservations ?? 0),
          sales: Number(row.sales ?? 0),
        };
      } catch (error) {
        console.error("Error fetching funnel by month:", error);
        this.isDatabaseAvailable = false;
      }
    }

    const empty = {
      leads: 0,
      opportunities: 0,
      visitsA: 0,
      visitsR: 0,
      reservations: 0,
      sales: 0,
    };

    const forAll = month === 'all';

    for (const lead of this.memoryLeads.values()) {
      const leadMonth = normalizeMonthKey(lead?.month_ref) ?? normalizeMonthKey(lead?.created_at);
      if (!forAll && leadMonth !== month) continue;
      if (lead?.is_deleted) continue;

      empty.leads += 1;

      const tags = Array.isArray(lead?.tags)
        ? lead.tags
        : Array.isArray(lead?.tags_json)
        ? lead.tags_json
        : [];

      if (tags.some((tag: any) => String(tag?.name ?? '').toLowerCase().includes('oportunidade'))) {
        empty.opportunities += 1;
      }

      if (lead?.status_id === 90926003) empty.visitsA += 1;
      if (lead?.status_id === 94531847) empty.visitsR += 1;
      if (lead?.status_id === 96470303) empty.reservations += 1;
      if (lead?.status_id === 142) empty.sales += 1;
    }

    return empty;
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