import { db } from './db';
import { eq, desc } from 'drizzle-orm';
import { 
  metrics, campaigns, activities, apiConnections, reports,
  type Metrics, type InsertMetrics, 
  type Campaign, type InsertCampaign,
  type Activity, type InsertActivity,
  type ApiConnection, type InsertApiConnection,
  type Report, type InsertReport
} from "@shared/schema";
import { randomUUID } from "crypto";

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