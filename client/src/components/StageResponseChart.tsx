import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface StageMetricsResponse {
  monthStart: string;
  monthEnd: string;

  totalRowsHuman: number;
  totalRowsAi: number;

  sumResponseTimeHuman: number; // segundos (soma do mês)
  sumResponseTimeAi: number;    // segundos (soma do mês)
}

interface Props {
  metrics: StageMetricsResponse;
}

function formatSecondsToTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));

  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  // Se passou de 1 dia
  if (days > 0) {
    if (hours > 0) {
      return `${days}d ${hours}h`;
    }
    return `${days}d`;
  }

  // Se passou de 1 hora
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function StageResponseChart({ metrics }: Props) {
  const totalHuman = Math.max(1, Number(metrics.totalRowsHuman ?? 0));
  const totalAi = Math.max(1, Number(metrics.totalRowsAi ?? 0));

  const avgHumanSeconds = Number(metrics.sumResponseTimeHuman ?? 0) / totalHuman;
  const avgAiSeconds = Number(metrics.sumResponseTimeAi ?? 0) / totalAi;

  const data = [
    { name: "Humano", seconds: avgHumanSeconds, base: Number(metrics.totalRowsHuman ?? 0) },
    { name: "IA", seconds: avgAiSeconds, base: Number(metrics.totalRowsAi ?? 0) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md rounded-2xl shadow-lg p-4 bg-white"
    >
      <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "0.25rem", textAlign: "center" }}>
        Média de tempo entre 1ª resposta
      </p>

      <p className="text-xs text-center text-muted-foreground mb-3">
        Base: Humano {Number(metrics.totalRowsHuman ?? 0)} leads · IA {Number(metrics.totalRowsAi ?? 0)} leads
      </p>

      <div className="w-full h-64">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => formatSecondsToTime(Number(v))} />
            <Tooltip
              formatter={(value, _name, props: any) => {
                const base = props?.payload?.base ?? 0;
                return [`${formatSecondsToTime(Number(value))} (base: ${base})`, "Média"];
              }}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="seconds" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}