import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
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
  leads: integer("leads").notNull().default(0),
  spend: decimal("spend", { precision: 12, scale: 2 }).notNull().default("0.00"),
  roi: decimal("roi", { precision: 8, scale: 2 }).notNull().default("0.00"),
  status: text("status").notNull().default("active"), // 'active', 'paused', 'ended'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

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
