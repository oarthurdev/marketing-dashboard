// TagPieChart.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TagCount = { tag: string; total: number };

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function hashHue(input: string) {
  // cor determinística por tag (não muda toda hora)
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) % 360;
  return h;
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function TagPieChart({ month }: { month?: string }) {
  const [data, setData] = useState<TagCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
   
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const url = month ? `/api/dashboard/tags?month=${encodeURIComponent(month)}` : '/api/dashboard/tags';
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const normalized = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        if (alive) setData(normalized as TagCount[]);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Falhou");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [month]);

  const { total, slices } = useMemo(() => {
    const t = data.reduce((acc, d) => acc + (Number(d.total) || 0), 0);
    const top = [...data]
      .filter(d => (Number(d.total) || 0) > 0)
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .slice(0, 12); // limita pra não virar carnaval

    // Se tiver muita tag, agrupa o resto em "Outras"
    const rest = data
      .filter(d => !top.some(x => x.tag === d.tag))
      .reduce((acc, d) => acc + (Number(d.total) || 0), 0);

    const final = rest > 0 ? [...top, { tag: "Outras", total: rest }] : top;

    let angle = 0;
    const computed = final.map((d) => {
      const fraction = t > 0 ? (Number(d.total) || 0) / t : 0;
      const start = angle;
      const end = angle + fraction * 360;
      angle = end;
      return { ...d, fraction, start, end };
    });

    return { total: t, slices: computed };
  }, [data]);

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 120;
  const innerR = 62; // donut style
  const centerText = active
    ? slices.find(s => s.tag === active)
    : null;

  if (loading) {
    return (
      <div className="w-full rounded-2xl border p-4 shadow-sm">
        <div className="text-lg font-semibold">Tags</div>
        <div className="mt-3 animate-pulse h-72 rounded-xl bg-neutral-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-2xl border p-4 shadow-sm">
        <div className="text-lg font-semibold">Tags</div>
        <div className="mt-2 text-sm text-red-600">Erro: {error}</div>
      </div>
    );
  }

  if (!slices.length || total === 0) {
    return (
      <div className="w-full rounded-2xl border p-4 shadow-sm">
        <div className="text-lg font-semibold text-center mt-2">Tags</div>
        <div className="mt-2 text-sm text-neutral-600 text-center">
          Sem dados para o período selecionado.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Leads por Tag</div>
          <div className="text-sm text-neutral-600">
            Total (somatório por tag): <span className="font-medium">{total}</span>
          </div>
        </div>

        <button
          className="text-sm rounded-xl border px-3 py-1 hover:bg-neutral-50"
          onClick={() => setActive(null)}
        >
          Limpar foco
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4 items-center">
        <div className="flex justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <AnimatePresence>
              {slices.map((s) => {
                const d = arcPath(cx, cy, r, s.start, s.end);
                const hue = hashHue(s.tag);
                const fill = `hsl(${hue} 75% 55%)`;
                const isActive = active === s.tag;
                const mid = (s.start + s.end) / 2;
                const bump = active === s.tag ? 8 : 0;
                const p = polarToCartesian(0, 0, bump, mid); // usando 0,0 pq é só vetor
                const dx = p.x;
                const dy = p.y;

                return (
                  <motion.path
                    key={s.tag}
                    d={d}
                    fill={fill}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: 1,
                        x: dx,
                        y: dy,
                        filter: isActive ? "drop-shadow(0px 6px 14px rgba(0,0,0,0.12))" : "none",
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    onMouseEnter={() => setActive(s.tag)}
                    onMouseLeave={() => setActive((cur) => (cur === s.tag ? null : cur))}
                    onClick={() => setActive((cur) => (cur === s.tag ? null : s.tag))}
                    style={{ cursor: "pointer" }}
                    />
                );
              })}
            </AnimatePresence>

            {/* furo do donut */}
            <circle cx={cx} cy={cy} r={innerR} fill="white" />

            {/* texto do centro */}
            <foreignObject
            x={cx - 90}
            y={cy - 45}
            width={180}
            height={90}
            pointerEvents="none"
            >
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
                
                <div
                style={{
                    color: centerText ? "#000000" : "#9CA3AF",
                    transition: "color 200ms ease"
                }}
                className="text-base font-semibold"
                >
                {centerText ? centerText.tag : "Passe o mouse"}
                </div>

                <div
                style={{
                    color: centerText ? "#000000" : "#6B7280",
                    transition: "color 200ms ease"
                }}
                className="text-sm"
                >
                {centerText
                    ? `${centerText.total} • ${formatPct(centerText.fraction)}`
                    : `${total} no total`}
                </div>

            </div>
            </foreignObject>
          </svg>
        </div>

        {/* legenda */}
        <div className="rounded-2xl border p-3">
          <div className="text-sm font-semibold">Top tags</div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {slices.map((s) => {
              const hue = hashHue(s.tag);
              const isActive = active === s.tag;
              return (
                <motion.button
                  key={s.tag}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left hover:bg-neutral-50 ${
                    isActive ? "ring-2 ring-black/10" : ""
                  }`}
                  onClick={() => setActive((cur) => (cur === s.tag ? null : s.tag))}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ background: `hsl(${hue} 75% 55%)` }}
                    />
                    <span className="text-sm font-medium">{s.tag}</span>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {s.total} <span className="text-xs">({formatPct(s.fraction)})</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}