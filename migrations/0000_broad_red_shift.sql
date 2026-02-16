-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"source" text NOT NULL,
	"details" text NOT NULL,
	"amount" numeric(12, 2),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_connections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"is_connected" boolean DEFAULT false NOT NULL,
	"last_sync" timestamp,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"total_leads" integer DEFAULT 0 NOT NULL,
	"conversion_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"daily_revenue" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"avg_cpa" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"lead_sources" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"format" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_lead_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"phone" text,
	"message_id" text,
	"source_app" text,
	"source_type" text,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"ad_id" varchar,
	"adset_id" varchar
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"name" text NOT NULL,
	"platform" text NOT NULL,
	"leads_monthly" integer DEFAULT 0 NOT NULL,
	"spend" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"roi" numeric(8, 2) DEFAULT '0.00',
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"id" varchar PRIMARY KEY NOT NULL,
	"source_app" text,
	"source_type" text,
	"source_url" text,
	"title" text,
	"body" text,
	"ctwa_last_clid" text,
	"last_lead_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now(),
	"effective_status" text,
	"is_archived" boolean DEFAULT false,
	"clicks_last_30d" integer,
	"cpa" numeric(12, 4),
	"impressions_last_30d" integer,
	"ctr_last_30d" numeric(12, 6),
	"cpc_last_30d" numeric(12, 6),
	"objective" text,
	"buying_type" text,
	"leads_weekly" integer,
	"leads_daily" integer,
	"monthly_oportunity" integer,
	"weekly_oportunity" integer,
	"daily_oportunity" integer,
	"leads_visita_agendada_daily" integer,
	"leads_visita_realizada_daily" integer,
	"leads_reserva_daily" integer,
	"leads_venda_daily" integer,
	"leads_visita_agendada_weekly" integer,
	"leads_visita_realizada_weekly" integer,
	"leads_reserva_weekly" integer,
	"leads_venda_weekly" integer,
	"leads_visita_agendada_monthly" integer,
	"leads_visita_realizada_monthly" integer,
	"leads_reserva_monthly" integer,
	"leads_venda_monthly" integer
);
--> statement-breakpoint
CREATE TABLE "adsets" (
	"id" varchar PRIMARY KEY NOT NULL,
	"campaign_id" varchar NOT NULL,
	"name" text,
	"platform" text DEFAULT 'meta',
	"status" text,
	"effective_status" text,
	"is_archived" boolean DEFAULT false,
	"start_date" timestamp,
	"end_date" timestamp,
	"spend" numeric(12, 2) DEFAULT '0',
	"clicks_last_30d" integer DEFAULT 0,
	"impressions_last_30d" integer DEFAULT 0,
	"ctr_last_30d" numeric(10, 4),
	"cpc_last_30d" numeric(12, 4),
	"cpa" numeric(12, 4),
	"leads" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ads" (
	"id" varchar PRIMARY KEY NOT NULL,
	"campaign_id" varchar NOT NULL,
	"adset_id" varchar NOT NULL,
	"name" text,
	"platform" text DEFAULT 'meta',
	"status" text,
	"effective_status" text,
	"is_archived" boolean DEFAULT false,
	"creative_id" varchar,
	"spend" numeric(12, 2) DEFAULT '0',
	"clicks_last_30d" integer DEFAULT 0,
	"impressions_last_30d" integer DEFAULT 0,
	"ctr_last_30d" numeric(10, 4),
	"cpc_last_30d" numeric(12, 4),
	"cpa" numeric(12, 4),
	"leads" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_stage_counts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"pipeline_id" bigint NOT NULL,
	"stage_id" bigint NOT NULL,
	"stage_name" text,
	"leads_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"pipeline_name" text,
	CONSTRAINT "uq_stage_count" UNIQUE("pipeline_id","stage_id"),
	CONSTRAINT "lead_stage_counts_pipeline_stage_unique" UNIQUE("pipeline_id","stage_id")
);
--> statement-breakpoint
CREATE TABLE "lead_closing_time" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" bigint NOT NULL,
	"closing_days" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"pipeline_id" numeric,
	CONSTRAINT "lead_closing_time_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_lead_events" ADD CONSTRAINT "campaign_lead_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adsets" ADD CONSTRAINT "adsets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_adset_id_fkey" FOREIGN KEY ("adset_id") REFERENCES "public"."adsets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_campaign_lead_events_campaign" ON "campaign_lead_events" USING btree ("campaign_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_adsets_campaign_id" ON "adsets" USING btree ("campaign_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ads_adset_id" ON "ads" USING btree ("adset_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ads_campaign_id" ON "ads" USING btree ("campaign_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_lead_stage_counts_pipeline_stage" ON "lead_stage_counts" USING btree ("pipeline_id" int8_ops,"stage_id" int8_ops);
*/