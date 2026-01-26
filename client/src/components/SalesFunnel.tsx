import React, { useMemo, useRef, useState } from "react";

type FunnelStageKey = "leads" | "opportunities" | "visits" | "reservations" | "sales";

export type SalesFunnelData = {
  leads: number;
  opportunities: number;
  visits: number;
  reservations: number;
  sales: number;
};

type Props = {
  data: SalesFunnelData;
  /** Optional label shown in the header (e.g., "01/12/2025 a 31/12/2025") */
  rangeLabel?: string;
  className?: string;
};

type TooltipState = {
  key: FunnelStageKey;
  x: number;
  y: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function formatPct(p: number) {
  if (!Number.isFinite(p)) return "—";
  // Pretty: 100%, 28%, 1.5%, 2.3%...
  if (p >= 10 || p === 0) return `${Math.round(p)}%`;
  return `${(Math.round(p * 10) / 10).toFixed(1)}%`;
}

function formatInt(n: number) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}

export function SalesFunnelPrintModern({ data, rangeLabel, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const stages = useMemo(() => {
    const leads = Number(data?.leads ?? 0) || 0;
    const getPct = (v: number) => (leads > 0 ? (v / leads) * 100 : 0);

    const items: Array<{
      key: FunnelStageKey;
      label: string;
      value: number;
      pct: number;
      hint: string;
      accent: string; // tailwind gradient class
      chip: string; // tailwind bg class
    }> = [
      {
        key: "leads",
        label: "LEADS",
        value: Number(data?.leads ?? 0) || 0,
        pct: 100,
        hint: "Topo do funil: total de leads captados no período.",
        accent: "from-sky-500 to-violet-500",
        chip: "bg-sky-500/15 text-sky-700 dark:text-sky-200",
      },
      {
        key: "opportunities",
        label: "OPORTUNIDADES",
        value: Number(data?.opportunities ?? 0) || 0,
        pct: getPct(Number(data?.opportunities ?? 0) || 0),
        hint: "Leads qualificados como oportunidade (pré-venda/SDR).",
        accent: "from-violet-600 to-fuchsia-600",
        chip: "bg-violet-500/15 text-violet-700 dark:text-violet-200",
      },
      {
        key: "visits",
        label: "VISITAS",
        value: Number(data?.visits ?? 0) || 0,
        pct: getPct(Number(data?.visits ?? 0) || 0),
        hint: "Visitas/agendamentos efetivados.",
        accent: "from-emerald-500 to-teal-500",
        chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
      },
      {
        key: "reservations",
        label: "RESERVA",
        value: Number(data?.reservations ?? 0) || 0,
        pct: getPct(Number(data?.reservations ?? 0) || 0),
        hint: "Reservas realizadas.",
        accent: "from-amber-500 to-orange-500",
        chip: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
      },
      {
        key: "sales",
        label: "VENDA",
        value: Number(data?.sales ?? 0) || 0,
        pct: getPct(Number(data?.sales ?? 0) || 0),
        hint: "Vendas/conversões (fim do funil).",
        accent: "from-rose-500 to-pink-500",
        chip: "bg-rose-500/15 text-rose-700 dark:text-rose-200",
      },
    ];

    return items;
  }, [data]);

  const stageByKey = useMemo(() => {
    return new Map(stages.map((s) => [s.key, s]));
  }, [stages]);

  const onStageEnter = (key: FunnelStageKey) => (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({
      key,
      x: clamp(e.clientX - rect.left, 12, rect.width - 12),
      y: clamp(e.clientY - rect.top, 12, rect.height - 12),
    });
  };

  const onStageMove = (key: FunnelStageKey) => (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip((prev) => {
      if (!prev || prev.key !== key) {
        return {
          key,
          x: clamp(e.clientX - rect.left, 12, rect.width - 12),
          y: clamp(e.clientY - rect.top, 12, rect.height - 12),
        };
      }
      return {
        ...prev,
        x: clamp(e.clientX - rect.left, 12, rect.width - 12),
        y: clamp(e.clientY - rect.top, 12, rect.height - 12),
      };
    });
  };

  const onStageLeave = () => setTip(null);

  const tipStage = tip ? stageByKey.get(tip.key) : null;

  /**
   * Layout:
   * - We keep the printed geometry but modernize colors, typography and interaction.
   * - SVG viewBox coordinates were kept close to the original component for minimal drift.
   */
  return (
    <div
      ref={containerRef}
      className={[
        "relative w-full rounded-2xl border border-slate-200/70 bg-white/80 shadow-[0_14px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur",
        "dark:border-slate-800/70 dark:bg-slate-950/60",
        className || "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex flex-col gap-1 px-6 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            FUNIL DE VENDAS{rangeLabel ? ` - ${rangeLabel}` : ""}
          </h2>

          {/* subtle legend */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500" />
            <span>Interativo • passe o mouse</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 pt-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/70 dark:bg-slate-950">
          <div className="relative overflow-hidden rounded-2xl">
            {/* soft glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_50%_0%,rgba(99,102,241,0.12),transparent_60%)]" />

            {/* SVG */}
            <svg
              viewBox="0 0 1000 520"
              className="relative block h-[360px] w-full sm:h-[420px]"
              aria-label="Funil de vendas"
              role="img"
            >
              <defs>
                {/* top trapezoid */}
                <linearGradient id="topGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
                  <stop offset="55%" stopColor="#A78BFA" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#F472B6" stopOpacity="0.95" />
                </linearGradient>

                {/* opportunities funnel */}
                <linearGradient id="oppGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111827" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#111827" stopOpacity="0.98" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="1" />
                </linearGradient>

                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%">
                  <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.18" />
                </filter>

                <filter id="crispShadow" x="-20%" y="-20%" width="140%" height="160%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.20" />
                </filter>
              </defs>

              {/* grid lines */}
              {[
                { y: 178 },
                { y: 258 },
                { y: 338 },
                { y: 418 },
              ].map((l, idx) => (
                <line
                  key={idx}
                  x1="200"
                  x2="850"
                  y1={l.y}
                  y2={l.y}
                  stroke="#CBD5E1"
                  strokeOpacity="0.65"
                  strokeWidth="2"
                />
              ))}

              {/* left labels */}
              {[
                { label: "LEADS", y: 140 },
                { label: "OPORTUNIDADES", y: 220 },
                { label: "VISITAS", y: 300 },
                { label: "RESERVA", y: 380 },
                { label: "VENDA", y: 460 },
              ].map((t, i) => (
                <text
                  key={i}
                  x="70"
                  y={t.y}
                  textAnchor="start"
                  fontSize="26"
                  fontWeight="800"
                  fill="#0F172A"
                >
                  {t.label}
                </text>
              ))}

              {/* right percentages */}
              <g fontSize="24" fontWeight="800" fill="#0F172A">
                <text x="900" y="140" textAnchor="end">
                  {formatPct(stageByKey.get("leads")?.pct ?? 0)}
                </text>
                <text x="900" y="220" textAnchor="end">
                  {formatPct(stageByKey.get("opportunities")?.pct ?? 0)}
                </text>
                <text x="900" y="300" textAnchor="end">
                  {formatPct(stageByKey.get("visits")?.pct ?? 0)}
                </text>
                <text x="900" y="380" textAnchor="end">
                  {formatPct(stageByKey.get("reservations")?.pct ?? 0)}
                </text>
                <text x="900" y="460" textAnchor="end">
                  {formatPct(stageByKey.get("sales")?.pct ?? 0)}
                </text>
              </g>

              {/* top trapezoid (LEADS) */}
              <g
                onMouseEnter={onStageEnter("leads")}
                onMouseMove={onStageMove("leads")}
                onMouseLeave={onStageLeave}
                style={{ cursor: "help" }}
                filter="url(#softShadow)"
              >
                <path
                  d="M290 210 L370 150 L650 150 L770 210 L770 210 L290 210 Z"
                  fill="url(#topGrad)"
                  stroke="#0F172A"
                  strokeOpacity="0.22"
                  strokeWidth="2"
                />
                <text x="510" y="120" textAnchor="middle" fontSize="28" fontWeight="900" fill="#0F172A">
                  {formatInt(stageByKey.get("leads")?.value ?? 0)}
                </text>

                {/* invisible hitbox */}
                <rect x="270" y="105" width="540" height="140" fill="transparent" />
              </g>

              {/* opportunities funnel */}
              <g
                onMouseEnter={onStageEnter("opportunities")}
                onMouseMove={onStageMove("opportunities")}
                onMouseLeave={onStageLeave}
                style={{ cursor: "help" }}
                filter="url(#crispShadow)"
              >
                <path
                  d="M390 214 L670 214 L630 340 L430 340 Z"
                  fill="url(#oppGrad)"
                  stroke="#0F172A"
                  strokeOpacity="0.22"
                  strokeWidth="2"
                />
                {/* highlight */}
                <path
                  d="M405 225 L655 225 L620 330 L440 330 Z"
                  fill="rgba(255,255,255,0.06)"
                />
                {/* value aligned closer to the OPORTUNIDADES row */}
                <text x="510" y="262" textAnchor="middle" fontSize="30" fontWeight="900" fill="#FFFFFF">
                  {formatInt(stageByKey.get("opportunities")?.value ?? 0)}
                </text>

                <rect x="380" y="210" width="310" height="150" fill="transparent" />
              </g>

              {/* tiny neck (VISITAS marker area) */}
              <g
                onMouseEnter={onStageEnter("visits")}
                onMouseMove={onStageMove("visits")}
                onMouseLeave={onStageLeave}
                style={{ cursor: "help" }}
              >
                <path
                  d="M498 320 L522 320 L510 340 Z"
                  fill="#E2E8F0"
                  stroke="#0F172A"
                  strokeOpacity="0.25"
                  strokeWidth="2"
                />
                <text x="510" y="336" textAnchor="middle" fontSize="20" fontWeight="900" fill="#0F172A">
                  {formatInt(stageByKey.get("visits")?.value ?? 0)}
                </text>

                <rect x="468" y="300" width="84" height="70" fill="transparent" />
              </g>

              {/* stem line (RESERVA + VENDA) */}
              <g
                onMouseEnter={onStageEnter("reservations")}
                onMouseMove={onStageMove("reservations")}
                onMouseLeave={onStageLeave}
                style={{ cursor: "help" }}
              >
                <line
                  x1="510"
                  y1="340"
                  x2="510"
                  y2="495"
                  stroke="#111827"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <text x="575" y="392" textAnchor="start" fontSize="28" fontWeight="900" fill="#0F172A">
                  {formatInt(stageByKey.get("reservations")?.value ?? 0)}
                </text>

                <rect x="490" y="352" width="190" height="90" fill="transparent" />
              </g>

              <g
                onMouseEnter={onStageEnter("sales")}
                onMouseMove={onStageMove("sales")}
                onMouseLeave={onStageLeave}
                style={{ cursor: "help" }}
              >
                <text x="575" y="472" textAnchor="start" fontSize="28" fontWeight="900" fill="#0F172A">
                  {formatInt(stageByKey.get("sales")?.value ?? 0)}
                </text>

                <rect x="490" y="440" width="190" height="60" fill="transparent" />
              </g>
            </svg>

            {/* Tooltip */}
            {tipStage && tip && (
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  left: tip.x,
                  top: tip.y,
                  transform: "translate(12px, -12px)",
                }}
              >
                <div className="max-w-[280px] rounded-xl border border-slate-200/70 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/90">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-extrabold tracking-wide text-slate-900 dark:text-white">
                        {tipStage.label}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{tipStage.hint}</div>
                    </div>

                    <span className={"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold " + tipStage.chip}>
                      {formatPct(tipStage.pct)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-end justify-between">
                    <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {formatInt(tipStage.value)}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">no período</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* bottom micro legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
            <span>💡 Dica: passe o mouse nas etapas para ver detalhes.</span>
            <span className="hidden sm:inline">Atualizado em tempo real conforme o banco.</span>
          </div>
        </div>
      </div>
    </div>
  );
}


export default SalesFunnelPrintModern;
