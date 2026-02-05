import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Stage = {
  stageId: number;
  stageName: string;
  leadsCount: number;
};

type ApiResponse = {
  stages: Stage[];
  avgClosingDays: number;
};

export function LeadsPipelineChart({ pipelineId }: { pipelineId: number }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leads-metrics/${pipelineId}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [pipelineId]);

  if (loading) {
    return <p>Carregando pipeline...</p>;
  }

  if (!data) {
    return <p>Sem dados disponíveis</p>;
  }

  // ✅ filtro direto, sem hook
  const stagesWithLeads = data.stages.filter(
    stage => stage.leadsCount > 0
  );

  if (stagesWithLeads.length === 0) {
    return <p>Nenhuma etapa com leads nesse pipeline</p>;
  }

  const maxLeads = Math.max(
    ...stagesWithLeads.map(stage => stage.leadsCount)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        padding: 24,
        background: "#0f172a",
        borderRadius: 12,
        color: "#e5e7eb",
      }}
    >
      <h2 style={{ marginBottom: 20 }}>📊 Pipeline de Leads</h2>

      {/* Média de fechamento */}
      <div
        style={{
          background: "#020617",
          padding: 14,
          borderRadius: 10,
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        ⏱️ Tempo médio de fechamento:{" "}
        <strong>{data.avgClosingDays.toFixed(1)} dias</strong>
      </div>

      {/* Gráfico */}
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        {stagesWithLeads.map((stage, index) => {
          const height = (stage.leadsCount / maxLeads) * 220;

          return (
            <div
              key={stage.stageId}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                minWidth: 60,
                maxWidth: 120,
              }}
            >
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height, opacity: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                style={{
                  width: "100%",
                  background:
                    "linear-gradient(180deg, #38bdf8, #2563eb)",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />

              <strong style={{ fontSize: 13 }}>
                {stage.leadsCount}
              </strong>

              <span
                style={{
                  fontSize: 11,
                  opacity: 0.75,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                {stage.stageName}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
