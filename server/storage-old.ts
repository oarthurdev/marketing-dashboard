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

export class MemStorage implements IStorage {
  private metrics: Map<string, Metrics>;
  private campaigns: Map<string, Campaign>;
  private activities: Map<string, Activity>;
  private apiConnections: Map<string, ApiConnection>;
  private reports: Map<string, Report>;

  constructor() {
    this.metrics = new Map();
    this.campaigns = new Map();
    this.activities = new Map();
    this.apiConnections = new Map();
    this.reports = new Map();
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize API connections
    const defaultConnections = [
      { platform: "hubspot", isConnected: true, config: {} },
      { platform: "google_ads", isConnected: true, config: {} },
      { platform: "shopify", isConnected: false, config: {} },
      { platform: "meta_ads", isConnected: false, config: {} }
    ];

    defaultConnections.forEach(conn => {
      const id = randomUUID();
      const connection: ApiConnection = {
        ...conn,
        id,
        lastSync: new Date()
      };
      this.apiConnections.set(id, connection);
    });
  }

  async getMetrics(limit = 30): Promise<Metrics[]> {
    const allMetrics = Array.from(this.metrics.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return allMetrics.slice(0, limit);
  }

  async getLatestMetrics(): Promise<Metrics | undefined> {
    const allMetrics = await this.getMetrics(1);
    return allMetrics[0];
  }

  async createMetrics(insertMetrics: InsertMetrics): Promise<Metrics> {
    const id = randomUUID();
    const metrics: Metrics = {
      id,
      date: insertMetrics.date || new Date(),
      totalLeads: insertMetrics.totalLeads || 0,
      conversionRate: insertMetrics.conversionRate || "0.00",
      dailyRevenue: insertMetrics.dailyRevenue || "0.00",
      avgCPA: insertMetrics.avgCPA || "0.00",
      leadSources: insertMetrics.leadSources || {},
      createdAt: new Date()
    };
    this.metrics.set(id, metrics);
    return metrics;
  }

  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  async getCampaignById(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
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
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const existing = this.campaigns.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.campaigns.set(id, updated);
    return updated;
  }

  async getRecentActivities(limit = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      id,
      type: insertActivity.type,
      source: insertActivity.source,
      details: insertActivity.details,
      amount: insertActivity.amount || null,
      timestamp: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getApiConnections(): Promise<ApiConnection[]> {
    return Array.from(this.apiConnections.values());
  }

  async getApiConnectionByPlatform(platform: string): Promise<ApiConnection | undefined> {
    return Array.from(this.apiConnections.values())
      .find(conn => conn.platform === platform);
  }

  async createApiConnection(insertConnection: InsertApiConnection): Promise<ApiConnection> {
    const id = randomUUID();
    const connection: ApiConnection = {
      id,
      platform: insertConnection.platform,
      isConnected: insertConnection.isConnected || false,
      lastSync: insertConnection.lastSync || null,
      config: insertConnection.config || {}
    };
    this.apiConnections.set(id, connection);
    return connection;
  }

  async updateApiConnection(platform: string, updates: Partial<InsertApiConnection>): Promise<ApiConnection | undefined> {
    const existing = Array.from(this.apiConnections.entries())
      .find(([_, conn]) => conn.platform === platform);
    
    if (!existing) return undefined;
    
    const [id, connection] = existing;
    const updated = { ...connection, ...updates };
    this.apiConnections.set(id, updated);
    return updated;
  }

  async getReports(limit = 20): Promise<Report[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => new Date(b.generatedAt!).getTime() - new Date(a.generatedAt!).getTime())
      .slice(0, limit);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      id,
      title: insertReport.title,
      type: insertReport.type,
      format: insertReport.format,
      data: insertReport.data || {},
      generatedAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }
}

export const storage = new MemStorage();
