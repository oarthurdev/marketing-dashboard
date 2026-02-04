import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type FunnelStageKey =
  | "leads"
  | "opportunities"
  | "visitsA"
  | "visitsR"
  | "reservations"
  | "sales";

export type SalesFunnelData = {
  leads: number;
  opportunities: number;
  visitsA: number;
  visitsR: number;
  reservations: number;
  sales: number;
};

type Props = {
  data: SalesFunnelData;
  rangeLabel?: string;
  className?: string;
};

type TooltipState = {
  key: FunnelStageKey;
  x: number;
  y: number;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const formatInt = (n: number) =>
  new Intl.NumberFormat("pt-BR").format(n || 0);

const formatPct = (n: number) =>
  `${Math.round(n)}%`;

export default function SalesFunnel({ data, rangeLabel, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const stages = useMemo(() => {
    const leads = data.leads || 0;
    const pct = (v: number) => (leads ? (v / leads) * 100 : 0);

    return {
      leads: { label: "LEADS", value: data.leads, pct: 100 },
      opportunities: {
        label: "OPORTUNIDADES",
        value: data.opportunities,
        pct: pct(data.opportunities),
      },
      visitsA: { label: "VISITAS AGEND.", value: data.visitsA, pct: pct(data.visitsA) },
      visitsR: { label: "VISITAS REALIZ.", value: data.visitsR, pct: pct(data.visitsR) },
      reservations: {
        label: "RESERVA",
        value: data.reservations,
        pct: pct(data.reservations),
      },
      sales: { label: "VENDA", value: data.sales, pct: pct(data.sales) },
    };
  }, [data]);

  const onMove =
    (key: FunnelStageKey) => (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTip({
        key,
        x: clamp(e.clientX - rect.left, 16, rect.width - 16),
        y: clamp(e.clientY - rect.top, 16, rect.height - 16),
      });
    };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl border border-slate-200/70 
        bg-gradient-to-b from-white to-slate-50 
        shadow-[0_10px_30px_rgba(15,23,42,0.08)] 
        ${className || ""}`}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Funil de Vendas {rangeLabel && `• ${rangeLabel}`}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Passe o mouse para ver detalhes
        </p>
      </div>

      {/* Funnel */}
      <div className="px-4 pb-6">
        <motion.svg
          viewBox="0 0 1000 520"
          className="w-full h-[520px] select-none"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <defs>
            <linearGradient id="topGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="55%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#F472B6" />
            </linearGradient>

            <linearGradient id="oppGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F2937" />
              <stop offset="60%" stopColor="#111827" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow
                dx="0"
                dy="14"
                stdDeviation="14"
                floodColor="#0F172A"
                floodOpacity="0.25"
              />
            </filter>
          </defs>

          {/* Labels */}
          {[
            ["LEADS", 140],
            ["OPORTUNIDADES", 220],
            ["VISITAS AGEND.", 300],
            ["VISITAS REALIZ.", 360],
            ["RESERVA", 420],
            ["VENDA", 480],
          ].map(([label, y]) => (
            <text
              key={label as string}
              x="60"
              y={y as number}
              fontSize="22"
              fontWeight="700"
              fill="#334155"
              letterSpacing="0.12em"
            >
              {label}
            </text>
          ))}

          {/* Percentuais */}
          {(
            Object.keys(stages) as FunnelStageKey[]
          ).map((k, i) => (
            <text
              key={k}
              x="940"
              y={[140, 220, 300, 360, 420, 480][i]}
              textAnchor="end"
              fontSize="20"
              fontWeight="700"
              fill="#0F172A"
            >
              {formatPct(stages[k].pct)}
            </text>
          ))}

          {/* LEADS */}
          <motion.g
            onMouseMove={onMove("leads")}
            onMouseLeave={() => setTip(null)}
            whileHover={{ scale: 1.02 }}
          >
            <path
              d="M290 210 L370 150 L650 150 L770 210 Z"
              fill="url(#topGrad)"
              filter="url(#softShadow)"
            />
            <text
              x="510"
              y="135"
              textAnchor="middle"
              fontSize="32"
              fontWeight="900"
              fill="#020617"
            >
              {formatInt(stages.leads.value)}
            </text>
          </motion.g>

          {/* OPORTUNIDADES */}
          <motion.g
            onMouseMove={onMove("opportunities")}
            onMouseLeave={() => setTip(null)}
            whileHover={{ scale: 1.015 }}
          >
            <path
              d="M390 214 L670 214 L630 340 L430 340 Z"
              fill="url(#oppGrad)"
              filter="url(#softShadow)"
            />
            <path
              d="M405 225 L655 225 L620 330 L440 330 Z"
              fill="rgba(255,255,255,0.06)"
            />
            <text
              x="510"
              y="220"
              textAnchor="middle"
              fontSize="30"
              fontWeight="900"
              fill="#F8FAFC"
            >
              {formatInt(stages.opportunities.value)}
            </text>
          </motion.g>

          {/* VISITAS AGENDADAS */}
          <motion.g
            onMouseMove={onMove("visitsA")}
            onMouseLeave={() => setTip(null)}
          >
            <text
              x="510"
              y="300"
              textAnchor="middle"
              fontSize="26"
              fontWeight="800"
              fill="#F8FAFC"
            >
              {formatInt(stages.visitsA.value)}
            </text>
          </motion.g>

          <motion.g
            onMouseMove={onMove("visitsR")}
            onMouseLeave={() => setTip(null)}
          >
            <text
              x="510"
              y="360"
              textAnchor="middle"
              fontSize="26"
              fontWeight="800"
              fill="#F8FAFC"
            >
              {formatInt(stages.visitsR.value)}
            </text>
          </motion.g>

          {/* RESERVA */}
          <motion.g
            onMouseMove={onMove("reservations")}
            onMouseLeave={() => setTip(null)}
          >
            <text
              x="500"
              y="420"
              fontSize="26"
              fontWeight="900"
              fill="#020617"
            >
              {formatInt(stages.reservations.value)}
            </text>
          </motion.g>

          {/* VENDA */}
          <motion.g
            onMouseMove={onMove("sales")}
            onMouseLeave={() => setTip(null)}
          >
            <text
              x="500"
              y="480"
              fontSize="26"
              fontWeight="900"
              fill="#020617"
            >
              {formatInt(stages.sales.value)}
            </text>
          </motion.g>
        </motion.svg>
      </div>

      {/* Tooltip */}
      {tip && (
        <div
          className="pointer-events-none absolute z-50 
            rounded-xl border border-slate-200/70 
            bg-white/95 backdrop-blur-sm 
            px-4 py-3 
            shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
          style={{
            left: tip.x,
            top: tip.y,
            transform: "translate(12px,-12px)",
          }}
        >
          <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            {stages[tip.key].label}
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatInt(stages[tip.key].value)}
          </div>
        </div>
      )}
    </div>
  );
}
