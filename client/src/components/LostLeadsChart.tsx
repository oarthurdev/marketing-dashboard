import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LostLeadReason = {
  reason: string;
  total: number;
};

type LostLeadsResponse = {
  totalLost: number;
  reasons: LostLeadReason[];
};

const COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#14b8a6",
  "#64748b",
];

export function LostLeadsChart({
  dateFrom,
  dateTo,
}: {
  dateFrom?: string;
  dateTo?: string;
}) {
  const [data, setData] = useState<LostLeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);

        const query = params.toString();
        const response = await fetch(
          `/api/dashboard/lost-leads${query ? `?${query}` : ""}`
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        if (alive) setData(json);
      } catch (err: any) {
        if (alive) setError(err?.message ?? "Falha ao carregar os dados");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [dateFrom, dateTo]);

  if (loading) {
    return <div className="h-[360px] animate-pulse rounded-xl bg-muted" />;
  }

  if (error) {
    return <p className="text-sm text-destructive">Erro: {error}</p>;
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div>
        <span className="text-3xl font-bold">{data.totalLost}</span>
        <span className="ml-2 text-sm text-muted-foreground">
          leads perdidos
        </span>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.reasons}
            layout="vertical"
            margin={{ top: 4, right: 44, bottom: 4, left: 32 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="reason"
              width={180}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [value, "Leads perdidos"]}
              cursor={{ fill: "hsl(var(--muted))" }}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
              {data.reasons.map((item, index) => (
                <Cell key={item.reason} fill={COLORS[index]} />
              ))}
              <LabelList dataKey="total" position="right" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
