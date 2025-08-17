import { db } from './db';
import { eq, desc, gte, lte, and } from 'drizzle-orm';
import { 
  metrics, campaigns, activities, apiConnections, reports,
  type Metrics, type InsertMetrics, 
  type Campaign, type InsertCampaign,
  type Activity, type InsertActivity,
  type ApiConnection, type InsertApiConnection,
  type Report, type InsertReport
} from "@shared/schema";

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

// Database storage implementation using Supabase
class DatabaseStorage implements IStorage {
  constructor() {
    // Try to initialize defaults, but don't fail if DB is not available
    this.initializeDefaults().catch(err => 
      console.error('Database initialization failed, continuing with limited functionality:', err.message)
    );
  }

  private async initializeDefaults() {
    try {
      // Test database connection first
      const testQuery = await db.select().from(apiConnections).limit(1);
      
      if (testQuery.length === 0) {
        // Initialize with default API connections
        const defaultConnections: InsertApiConnection[] = [
          { platform: 'hubspot', isConnected: false, lastSync: null, config: {} },
          { platform: 'google_ads', isConnected: false, lastSync: null, config: {} },
          { platform: 'shopify', isConnected: false, lastSync: null, config: {} },
          { platform: 'facebook_ads', isConnected: false, lastSync: null, config: {} },
          { platform: 'tiktok_ads', isConnected: false, lastSync: null, config: {} }
        ];

        await db.insert(apiConnections).values(defaultConnections);
        console.log('✓ Database connected and initialized successfully');
      }
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  // Metrics methods
  async getMetrics(limit: number = 30): Promise<Metrics[]> {
    try {
      const results = await db
        .select()
        .from(metrics)
        .orderBy(desc(metrics.date))
        .limit(limit);
      return results;
    } catch (error) {
      console.error('Database error in getMetrics:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async getLatestMetrics(): Promise<Metrics | undefined> {
    const results = await db
      .select()
      .from(metrics)
      .orderBy(desc(metrics.date))
      .limit(1);
    return results[0];
  }

  async createMetrics(insertMetrics: InsertMetrics): Promise<Metrics> {
    const results = await db
      .insert(metrics)
      .values(insertMetrics)
      .returning();
    return results[0];
  }

  // Campaigns methods
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaignById(id: string): Promise<Campaign | undefined> {
    const results = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id));
    return results[0];
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const results = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return results[0];
  }

  async updateCampaign(id: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const results = await db
      .update(campaigns)
      .set(updates)
      .where(eq(campaigns.id, id))
      .returning();
    return results[0];
  }

  // Activities methods
  async getRecentActivities(limit: number = 20): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const results = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return results[0];
  }

  // API Connections methods
  async getApiConnections(): Promise<ApiConnection[]> {
    return await db.select().from(apiConnections);
  }

  async getApiConnectionByPlatform(platform: string): Promise<ApiConnection | undefined> {
    const results = await db
      .select()
      .from(apiConnections)
      .where(eq(apiConnections.platform, platform));
    return results[0];
  }

  async createApiConnection(insertConnection: InsertApiConnection): Promise<ApiConnection> {
    const results = await db
      .insert(apiConnections)
      .values(insertConnection)
      .returning();
    return results[0];
  }

  async updateApiConnection(platform: string, updates: Partial<InsertApiConnection>): Promise<ApiConnection | undefined> {
    const results = await db
      .update(apiConnections)
      .set(updates)
      .where(eq(apiConnections.platform, platform))
      .returning();
    return results[0];
  }

  // Reports methods
  async getReports(limit: number = 10): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .orderBy(desc(reports.generatedAt))
      .limit(limit);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const results = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return results[0];
  }
}

// Export a single instance
export const storage = new DatabaseStorage();