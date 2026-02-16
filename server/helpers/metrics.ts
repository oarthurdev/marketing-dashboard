export function calculateMetrics(spend: number, revenue: number) {
  const safeSpend = Number(spend || 0);
  const safeRevenue = Number(revenue || 0);

  if (safeSpend <= 0) {
    return {
      roi: 0,
      roas: 0,
      profit: safeRevenue,
    };
  }

  const profit = safeRevenue - safeSpend;
  const roi = (profit / safeSpend) * 100;
  const roas = safeRevenue / safeSpend;

  return {
    roi: Number(roi.toFixed(2)),
    roas: Number(roas.toFixed(2)),
    profit: Number(profit.toFixed(2)),
  };
}
