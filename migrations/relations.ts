import { relations } from "drizzle-orm/relations";
import { campaigns, adsets, campaignLeadEvents } from "./schema";

export const adsetsRelations = relations(adsets, ({one}) => ({
	campaign: one(campaigns, {
		fields: [adsets.campaignId],
		references: [campaigns.id]
	}),
}));

export const campaignsRelations = relations(campaigns, ({many}) => ({
	adsets: many(adsets),
	campaignLeadEvents: many(campaignLeadEvents),
}));

export const campaignLeadEventsRelations = relations(campaignLeadEvents, ({one}) => ({
	campaign: one(campaigns, {
		fields: [campaignLeadEvents.campaignId],
		references: [campaigns.id]
	}),
}));