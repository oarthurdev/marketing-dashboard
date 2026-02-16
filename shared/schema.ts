import { pgTable, varchar, text, numeric, timestamp, boolean, jsonb, integer, time, index, foreignKey, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const activities = pgTable("activities", {
  id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
  type: text().notNull(),
  source: text().notNull(),
  details: text().notNull(),
  amount: numeric({ precision: 12, scale:  2 }),
  timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const apiConnections = pgTable("api_connections", {
  id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
  platform: text().notNull(),
  isConnected: boolean("is_connected").default(false).notNull(),
  lastSync: timestamp("last_sync", { mode: 'string' }),
  config: jsonb().default({}).notNull(),
});

export const metrics = pgTable("metrics", {
  id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
  date: timestamp({ mode: 'string' }).defaultNow().notNull(),
  totalLeads: integer("total_leads"),
  conversionRate: numeric("conversion_rate", { precision: 5, scale:  2 }).default('0.00').notNull(),
  dailyRevenue: numeric("daily_revenue", { precision: 12, scale:  2 }).default('0.00').notNull(),
  avgCpa: numeric("avg_cpa", { precision: 10, scale:  2 }).default('0.00').notNull(),
  leadSources: jsonb("lead_sources").default({}).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
  title: text().notNull(),
  type: text().notNull(),
  format: text().notNull(),
  data: jsonb().default({}).notNull(),
  generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  name: text().notNull(),
  platform: text().notNull(),
  leadsMonthly: integer("leads_monthly"),
  spend: numeric({ precision: 12, scale:  2 }).default('0.00').notNull(),
  roi: numeric({ precision: 8, scale:  2 }).default('0.00').notNull(),
  status: text().default('active').notNull(),
  startDate: timestamp("start_date", { mode: 'string' }),
  endDate: timestamp("end_date", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
  leadsWeekly: integer("leads_weekly"),
  leadsDaily: integer("leads_daily"),
  monthlyOportunity: integer("monthly_oportunity"),
  weeklyOportunity: integer("weekly_oportunity"),
  dailyOportunity: integer("daily_oportunity"),
  leadsVisitaAgendadaDaily: integer("leads_visita_agendada_daily"),
  leadsVisitaRealizadaDaily: integer("leads_visita_realizada_daily"),
  leadsReservaDaily: integer("leads_reserva_daily"),
  leadsVendaDaily: integer("leads_venda_daily"),
  leadsVisitaAgendadaWeekly: integer("leads_visita_agendada_weekly"),
  leadsVisitaRealizadaWeekly: integer("leads_visita_realizada_weekly"),
  leadsReservaWeekly: integer("leads_reserva_weekly"),
  leadsVendaWeekly: integer("leads_venda_weekly"),
  leadsVisitaAgendadaMonthly: integer("leads_visita_agendada_monthly"),
  leadsVisitaRealizadaMonthly: integer("leads_visita_realizada_monthly"),
  leadsReservaMonthly: integer("leads_reserva_monthly"),
  leadsVendaMonthly: integer("leads_venda_monthly"),
  updatedAt: time("updated_at"),
  sourceApp: text("source_app"),
  sourceType: text("source_type"),
  sourceUrl: text("source_url"),
  title: text(),
  body: text(),
  effectiveStatus: text("effective_status"),
  isArchived: boolean("is_archived"),
  objective: text(),
  buyingType: text("buying_type"),
  clicksLast30D: numeric("clicks_last_30d"),
  cpa: numeric(),
  revenue: numeric({ precision: 14, scale:  2 }),
});

export const adsets = pgTable("adsets", {
  id: varchar({ length: 255 }).primaryKey().notNull(),
  campaignId: varchar("campaign_id", { length: 255 }).notNull(),
  name: text(),
  platform: text().default('meta'),
  status: text(),
  effectiveStatus: text("effective_status"),
  isArchived: boolean("is_archived").default(false),
  startDate: timestamp("start_date", { mode: 'string' }),
  endDate: timestamp("end_date", { mode: 'string' }),
  spend: numeric({ precision: 12, scale:  2 }).default('0'),
  clicksLast30D: integer("clicks_last_30d").default(0),
  impressionsLast30D: integer("impressions_last_30d").default(0),
  ctrLast30D: numeric("ctr_last_30d", { precision: 10, scale:  4 }),
  cpcLast30D: numeric("cpc_last_30d", { precision: 12, scale:  4 }),
  cpa: numeric({ precision: 12, scale:  4 }),
  leads: integer().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index("idx_adsets_campaign_id").using("btree", table.campaignId.asc().nullsLast().op("text_ops")),
  index("idx_adsets_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
  foreignKey({
      columns: [table.campaignId],
      foreignColumns: [campaigns.id],
      name: "adsets_campaign_id_campaigns_id_fk"
    }).onDelete("cascade"),
]);

export const ads = pgTable("ads", {
  id: varchar({ length: 255 }).primaryKey().notNull(),
  campaignId: varchar("campaign_id", { length: 255 }).notNull(),
  adsetId: varchar("adset_id", { length: 255 }).notNull(),
  name: text(),
  platform: text().default('meta'),
  status: text(),
  effectiveStatus: text("effective_status"),
  isArchived: boolean("is_archived").default(false),
  creativeId: varchar("creative_id", { length: 255 }),
  spend: numeric({ precision: 12, scale:  2 }).default('0'),
  clicksLast30D: integer("clicks_last_30d").default(0),
  impressionsLast30D: integer("impressions_last_30d").default(0),
  ctrLast30D: numeric("ctr_last_30d", { precision: 10, scale:  4 }),
  cpcLast30D: numeric("cpc_last_30d", { precision: 12, scale:  4 }),
  cpa: numeric({ precision: 12, scale:  4 }),
  leads: integer().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index("idx_ads_adset_id").using("btree", table.adsetId.asc().nullsLast().op("text_ops")),
  index("idx_ads_campaign_id").using("btree", table.campaignId.asc().nullsLast().op("text_ops")),
  index("idx_ads_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
  foreignKey({
      columns: [table.campaignId],
      foreignColumns: [campaigns.id],
      name: "ads_campaign_id_campaigns_id_fk"
    }).onDelete("cascade"),
  foreignKey({
      columns: [table.adsetId],
      foreignColumns: [adsets.id],
      name: "ads_adset_id_adsets_id_fk"
    }).onDelete("cascade"),
]);

export const leadStageCounts = pgTable("lead_stage_counts", {
  id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
  pipelineId: integer("pipeline_id").notNull(),
  stageId: integer("stage_id").notNull(),
  stageName: varchar("stage_name", { length: 255 }).notNull(),
  leadsCount: integer("leads_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  pipelineName: varchar("pipeline_name", { length: 255 }).notNull(),
}, (table) => [
  unique("lead_stage_unique").on(table.pipelineId, table.stageId),
]);

export const campaignLeadEvents = pgTable("campaign_lead_events", {
  eventId: text("event_id").primaryKey().notNull(),
  campaignId: text("campaign_id").notNull(),
  phone: text(),
  messageId: text("message_id"),
  sourceApp: text("source_app"),
  sourceType: text("source_type"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  adId: varchar("ad_id"),
  adsetId: varchar("adset_id"),
}, (table) => [
  index("idx_campaign_lead_events_campaign").using("btree", table.campaignId.asc().nullsLast().op("text_ops")),
  foreignKey({
      columns: [table.campaignId],
      foreignColumns: [campaigns.id],
      name: "campaign_lead_events_campaign_id_fkey"
    }).onDelete("cascade"),
]);

export const leadClosingTime = pgTable("lead_closing_time", {
  id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
  leadId: integer("lead_id").notNull(),
  closingDays: integer("closing_days").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  pipelineId: integer("pipeline_id").notNull(),
});

export const kommoStageMetricsLogs = pgTable("kommo_stage_metrics_logs", {
  id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  payload: jsonb().notNull(),
});

function gen_random_uuid(): import("drizzle-orm").SQL<unknown> {
  return sql`gen_random_uuid()`;
}
