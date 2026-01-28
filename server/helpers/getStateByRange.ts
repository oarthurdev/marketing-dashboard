export function getLeadsByRange(campaign: any, range: "daily" | "weekly" | "monthly") {
  switch (range) {
    case "daily":
      return campaign.leads_daily ?? campaign.leadsDaily ?? 0;
    case "weekly":
      return campaign.leads_weekly ?? campaign.leadsWeekly ?? 0;
    case "monthly":
      return campaign.leads_monthly ?? campaign.leadsMonthly ?? 0;
    default:
      return 0;
  }
}

export function getOpportunitiesByRange(
  campaign: any,
  range: "daily" | "weekly" | "monthly"
) {
  switch (range) {
    case "daily":
      return (
        campaign.daily_oportunity ??
        campaign.dailyOportunity ??
        0
      );

    case "weekly":
      return (
        campaign.weekly_oportunity ??
        campaign.weeklyOportunity ??
        0
      );

    case "monthly":
      return (
        campaign.monthly_oportunity ??
        campaign.monthlyOportunity ??
        0
      );

    default:
      return 0;
  }
}