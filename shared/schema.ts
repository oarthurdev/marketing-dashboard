import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, numeric, index, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const metrics = pgTable("metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().defaultNow(),
  totalLeads: integer("total_leads").notNull().default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  dailyRevenue: decimal("daily_revenue", { precision: 12, scale: 2 }).notNull().default("0.00"),
  avgCPA: decimal("avg_cpa", { precision: 10, scale: 2 }).notNull().default("0.00"),
  leadSources: jsonb("lead_sources").$type<Record<string, number>>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  platform: text("platform").notNull(), // 'google', 'facebook', 'linkedin', etc.
  leads_monthly: integer("leads_monthly").notNull().default(0),
  leads_weekly: integer("leads_weekly").notNull().default(0),
  leads_daily: integer("leads_daily").notNull().default(0),
  monthly_oportunity: integer("monthly_oportunity").notNull().default(0),
  weekly_oportunity: integer("weekly_oportunity").notNull().default(0),
  daily_oportunity: integer("daily_oportunity").notNull().default(0),
  spend: decimal("spend", { precision: 12, scale: 2 }).notNull().default("0.00"),
  roi: decimal("roi", { precision: 8, scale: 2 }).notNull().default("0.00"),
  status: text("status").notNull().default("active"), // 'active', 'paused', 'ended'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adsets = pgTable(
  "adsets",
  {
    id: varchar("id", { length: 255 }).primaryKey(),

    campaign_id: varchar("campaign_id", { length: 255 })
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),

    name: text("name"),
    platform: text("platform").default("meta"),

    status: text("status"),
    effectiveStatus: text("effective_status"),
    isArchived: boolean("is_archived").default(false),

    startDate: timestamp("start_date", { withTimezone: false }),
    endDate: timestamp("end_date", { withTimezone: false }),

    // métricas
    spend: numeric("spend", { precision: 12, scale: 2 }).default("0"),
    clicksLast30d: integer("clicks_last_30d").default(0),
    impressionsLast30d: integer("impressions_last_30d").default(0),
    ctrLast30d: numeric("ctr_last_30d", { precision: 10, scale: 4 }),
    cpcLast30d: numeric("cpc_last_30d", { precision: 12, scale: 4 }),
    cpa: numeric("cpa", { precision: 12, scale: 4 }),

    // leads (se você for preencher por job/trigger)
    leads: integer("leads").default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    campaignIdIdx: index("idx_adsets_campaign_id").on(t.campaign_id),
    statusIdx: index("idx_adsets_status").on(t.status),
  })
);

/**
 * ADS
 * - Vinculado a campaigns.id e adsets.id
 * - Métricas agregadas (ex: últimos 30d)
 */
export const ads = pgTable(
  "ads",
  {
    id: varchar("id", { length: 255 }).primaryKey(),

    campaign_id: varchar("campaign_id", { length: 255 })
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),

    adsetId: varchar("adset_id", { length: 255 })
      .notNull()
      .references(() => adsets.id, { onDelete: "cascade" }),

    name: text("name"),
    platform: text("platform").default("meta"),

    status: text("status"),
    effectiveStatus: text("effective_status"),
    isArchived: boolean("is_archived").default(false),

    creativeId: varchar("creative_id", { length: 255 }),

    // métricas
    spend: numeric("spend", { precision: 12, scale: 2 }).default("0"),
    clicksLast30d: integer("clicks_last_30d").default(0),
    impressionsLast30d: integer("impressions_last_30d").default(0),
    ctrLast30d: numeric("ctr_last_30d", { precision: 10, scale: 4 }),
    cpcLast30d: numeric("cpc_last_30d", { precision: 12, scale: 4 }),
    cpa: numeric("cpa", { precision: 12, scale: 4 }),

    // leads
    leads: integer("leads").default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    campaignIdIdx: index("idx_ads_campaign_id").on(t.campaign_id),
    adsetIdIdx: index("idx_ads_adset_id").on(t.adsetId),
    statusIdx: index("idx_ads_status").on(t.status),
  })
);

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'lead', 'sale', 'campaign_launch', etc.
  source: text("source").notNull(),
  details: text("details").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const apiConnections = pgTable("api_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(),
  isConnected: boolean("is_connected").notNull().default(false),
  lastSync: timestamp("last_sync"),
  config: jsonb("config").$type<Record<string, any>>().notNull().default({}),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'daily', 'weekly', 'monthly'
  format: text("format").notNull(), // 'pdf', 'html', 'json'
  data: jsonb("data").$type<Record<string, any>>().notNull().default({}),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const insertMetricsSchema = createInsertSchema(metrics).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertApiConnectionSchema = createInsertSchema(apiConnections).omit({
  id: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generatedAt: true,
});

export type InsertMetrics = z.infer<typeof insertMetricsSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertApiConnection = z.infer<typeof insertApiConnectionSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Metrics = typeof metrics.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ApiConnection = typeof apiConnections.$inferSelect;
export type Report = typeof reports.$inferSelect;
