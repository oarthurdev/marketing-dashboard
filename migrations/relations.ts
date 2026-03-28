import { relations } from "drizzle-orm/relations";
import { campaigns, adsets, campaignLeadEvents, ads } from "./schema";

export const adsetsRelations = relations(adsets, ({one, many}) => ({
	campaign: one(campaigns, {
		fields: [adsets.campaignId],
		references: [campaigns.id]
	}),
	ads: many(ads),
}));

export const campaignsRelations = relations(campaigns, ({many}) => ({
	adsets: many(adsets),
	campaignLeadEvents: many(campaignLeadEvents),
	ads: many(ads),
}));

export const campaignLeadEventsRelations = relations(campaignLeadEvents, ({one}) => ({
	campaign: one(campaigns, {
		fields: [campaignLeadEvents.campaignId],
		references: [campaigns.id]
	}),
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