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

export function getVisitasAgendadasByRange(
  campaign: any,
  range: "daily" | "weekly" | "monthly"
) {
  switch (range) {
    case "daily":
      return (
        campaign.leads_visita_agendada_daily ?? 0
      );

    case "weekly":
      return (
        campaign.leads_visita_agendada_weekly ?? 0
      );

    case "monthly":
      return (
        campaign.leads_visita_agendada_monthly ?? 0
      );

    default:
      return 0;
  }
}

export function getVisitasRealizadasByRange(
  campaign: any,
  range: "daily" | "weekly" | "monthly"
) {
  switch (range) {
    case "daily":
      console.log(campaign);
      return (
        campaign.leads_visita_realizada_daily ?? 0
      );

    case "weekly":
      return (
        campaign.leads_visita_realizada_weekly ?? 0
      );

    case "monthly":
      return (
        campaign.leads_visita_realizada_monthly ?? 0
      );

    default:
      return 0;
  }
}

export function getReservaByRange(
  campaign: any,
  range: "daily" | "weekly" | "monthly"
) {
  switch (range) {
    case "daily":
      return (
        campaign.leads_reserva_daily ?? 0
      );

    case "weekly":
      return (
        campaign.leads_reserva_weekly ?? 0
      );

    case "monthly":
      return (
        campaign.leads_reserva_monthly ?? 0
      );

    default:
      return 0;
  }
}

export function getVendaByRange(
  campaign: any,
  range: "daily" | "weekly" | "monthly"
) {
  switch (range) {
    case "daily":
      return (
        campaign.leads_venda_daily ?? 0
      );

    case "weekly":
      return (
        campaign.leads_venda_weekly ?? 0
      );

    case "monthly":
      return (
        campaign.leads_venda_monthly ?? 0
      );

    default:
      return 0;
  }
}