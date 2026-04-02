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

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeMonthKey(value: any): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}$/.test(value)) return value;

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }

  return null;
}

function getMonthlyMetric(
  campaign: any,
  month: string,
  mapKeys: string[],
  fallbackKeys: string[]
): number {
  for (const key of mapKeys) {
    const source = campaign?.[key];
    if (!source) continue;

    // objeto: { "2026-03": 10 }
    if (typeof source === "object" && !Array.isArray(source)) {
      if (source[month] !== undefined && source[month] !== null) {
        return toNumber(source[month]);
      }
    }

    // array: [{ month: "2026-03", value: 10 }]
    if (Array.isArray(source)) {
      const found = source.find((item: any) => {
        const itemMonth =
          normalizeMonthKey(item?.month) ||
          normalizeMonthKey(item?.month_ref) ||
          normalizeMonthKey(item?.referenceMonth) ||
          normalizeMonthKey(item?.date);

        return itemMonth === month;
      });

      if (found) {
        return toNumber(
          found.value ??
          found.total ??
          found.count ??
          found.amount ??
          0
        );
      }
    }
  }

  for (const key of fallbackKeys) {
    if (campaign?.[key] !== undefined && campaign?.[key] !== null) {
      return toNumber(campaign[key]);
    }
  }

  return 0;
}

export function getLeadsByMonth(campaign: any, month: string): number {
  return getMonthlyMetric(
    campaign,
    month,
    ["leads_by_month", "leadsByMonth"],
    ["leads_monthly", "leadsMonthly"]
  );
}

export function getOpportunitiesByMonth(campaign: any, month: string): number {
  return getMonthlyMetric(
    campaign,
    month,
    ["opportunities_by_month", "opportunitiesByMonth", "oportunity_by_month", "oportunityByMonth"],
    ["monthly_oportunity", "monthlyOportunity", "monthly_opportunity", "monthlyOpportunity"]
  );
}

export function getVisitasAgendadasByMonth(campaign: any, month: string): number {
  return getMonthlyMetric(
    campaign,
    month,
    ["visitas_agendadas_by_month", "visitasAgendadasByMonth", "leadsVisitaAgendadaByMonth"],
    ["leadsVisitaAgendadaMonthly"]
  );
}

export function getVisitasRealizadasByMonth(campaign: any, month: string): number {
  return getMonthlyMetric(
    campaign,
    month,
    ["visitas_realizadas_by_month", "visitasRealizadasByMonth", "leadsVisitaRealizadaByMonth"],
    ["leadsVisitaRealizadaMonthly"]
  );
}

export function getReservaByMonth(campaign: any, month: string): number {
  return getMonthlyMetric(
    campaign,
    month,
    ["reservas_by_month", "reservasByMonth", "leadsReservaByMonth"],
    ["leadsReservaMonthly"]
  );
}

export function getVendaByMonth(campaign: any, month: string): number {
  return getMonthlyMetric(
    campaign,
    month,
    ["vendas_by_month", "vendasByMonth", "leadsVendaByMonth"],
    ["leadsVendaMonthly"]
  );
}

export function getVisitasAgendadasByRange(
  campaign: any,
  range: "daily" | "weekly" | "monthly"
) {
  switch (range) {
    case "daily":
      return (
        campaign.leadsVisitaAgendadaDaily ?? 0
      );

    case "weekly":
      return (
        campaign.leadsVisitaAgendadaWeekly ?? 0
      );

    case "monthly":
      return (
        campaign.leadsVisitaAgendadaMonthly ?? 0
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
        campaign.leadsVisitaRealizadaDaily ?? 0
      );

    case "weekly":
      return (
        campaign.leadsVisitaRealizadaWeekly ?? 0
      );

    case "monthly":
      return (
        campaign.leadsVisitaRealizadaMonthly ?? 0
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
        campaign.leadsReservaDaily ?? 0
      );

    case "weekly":
      return (
        campaign.leadsReservaWeekly ?? 0
      );

    case "monthly":
      return (
        campaign.leadsReservaMonthly ?? 0
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
        campaign.leadsVendaDaily ?? 0
      );

    case "weekly":
      return (
        campaign.leadsVendaWeekly ?? 0
      );

    case "monthly":
      return (
        campaign.leadsVendaMonthly ?? 0
      );

    default:
      return 0;
  }
}