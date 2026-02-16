import { pgTable, varchar, text, numeric, timestamp, boolean, jsonb, integer, index, foreignKey, uniqueIndex, unique, bigserial, bigint, serial } from "drizzle-orm/pg-core"
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
	totalLeads: integer("total_leads").default(0).notNull(),
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

export const campaigns = pgTable("campaigns", {
	name: text().notNull(),
	platform: text().notNull(),
	leadsMonthly: integer("leads_monthly").default(0).notNull(),
	spend: numeric({ precision: 12, scale:  2 }).default('0.00').notNull(),
	roi: numeric({ precision: 8, scale:  2 }).default('0.00'),
	status: text().default('active').notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	id: varchar().primaryKey().notNull(),
	sourceApp: text("source_app"),
	sourceType: text("source_type"),
	sourceUrl: text("source_url"),
	title: text(),
	body: text(),
	ctwaLastClid: text("ctwa_last_clid"),
	lastLeadAt: timestamp("last_lead_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	effectiveStatus: text("effective_status"),
	isArchived: boolean("is_archived").default(false),
	clicksLast30D: integer("clicks_last_30d"),
	cpa: numeric({ precision: 12, scale:  4 }),
	impressionsLast30D: integer("impressions_last_30d"),
	ctrLast30D: numeric("ctr_last_30d", { precision: 12, scale:  6 }),
	cpcLast30D: numeric("cpc_last_30d", { precision: 12, scale:  6 }),
	objective: text(),
	buyingType: text("buying_type"),
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
});

export const adsets = pgTable("adsets", {
	id: varchar().primaryKey().notNull(),
	campaignId: varchar("campaign_id").notNull(),
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
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "adsets_campaign_id_fkey"
		}).onDelete("cascade"),
]);

export const ads = pgTable("ads", {
	id: varchar().primaryKey().notNull(),
	campaignId: varchar("campaign_id").notNull(),
	adsetId: varchar("adset_id").notNull(),
	name: text(),
	platform: text().default('meta'),
	status: text(),
	effectiveStatus: text("effective_status"),
	isArchived: boolean("is_archived").default(false),
	creativeId: varchar("creative_id"),
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
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "ads_campaign_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.adsetId],
			foreignColumns: [adsets.id],
			name: "ads_adset_id_fkey"
		}).onDelete("cascade"),
]);

export const leadStageCounts = pgTable("lead_stage_counts", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pipelineId: bigint("pipeline_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	stageId: bigint("stage_id", { mode: "number" }).notNull(),
	stageName: text("stage_name"),
	leadsCount: integer("leads_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	pipelineName: text("pipeline_name"),
}, (table) => [
	uniqueIndex("idx_lead_stage_counts_pipeline_stage").using("btree", table.pipelineId.asc().nullsLast().op("int8_ops"), table.stageId.asc().nullsLast().op("int8_ops")),
	unique("uq_stage_count").on(table.pipelineId, table.stageId),
	unique("lead_stage_counts_pipeline_stage_unique").on(table.pipelineId, table.stageId),
]);

export const leadClosingTime = pgTable("lead_closing_time", {
	id: serial().primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	leadId: bigint("lead_id", { mode: "number" }).notNull(),
	closingDays: integer("closing_days"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	pipelineId: numeric("pipeline_id"),
}, (table) => [
	unique("lead_closing_time_lead_id_unique").on(table.leadId),
]);
