import { relations } from "drizzle-orm/relations";
import { campaigns, campaignLeadEvents, adsets, ads } from "./schema";

export const campaignLeadEventsRelations = relations(campaignLeadEvents, ({one}) => ({
	campaign: one(campaigns, {
		fields: [campaignLeadEvents.campaignId],
		references: [campaigns.id]
	}),
}));

export const campaignsRelations = relations(campaigns, ({many}) => ({
	campaignLeadEvents: many(campaignLeadEvents),
	adsets: many(adsets),
	ads: many(ads),
}));

export const adsetsRelations = relations(adsets, ({one, many}) => ({
	campaign: one(campaigns, {
		fields: [adsets.campaignId],
		references: [campaigns.id]
	}),
	ads: many(ads),
}));

export const adsRelations = relations(ads, ({one}) => ({
	campaign: one(campaigns, {
		fields: [ads.campaignId],
		references: [campaigns.id]
	}),
	adset: one(adsets, {
		fields: [ads.adsetId],
		references: [adsets.id]
	}),
}));