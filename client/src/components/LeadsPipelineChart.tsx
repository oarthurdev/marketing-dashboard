
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Stage = {
  stageId: number;
  stageName: string;
  leadsCount: number;
};

type Pipeline = {
  pipelineId: number;
  pipelineName: string;
  avgClosingDays: number;
  stages: Stage[];
};

type ApiResponse = {
  pipelines: {
    pipelineId: number;
    pipelineName: string;
    avgClosingDays: number;
    stages: Stage[];
  }[];
};

type Mode = "compact" | "detailed";

export function LeadsPipelineChart({
  mode = "detailed",
  month,
}: {
  mode?: Mode;
  month?: string;
}) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leads-metrics?month=${month || 'current'}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [month]);

  if (loading) return <p>Carregando pipelines...</p>;
  if (!data || data.pipelines.length === 0)
    return <p>Sem dados disponíveis</p>;

  const isCompact = mode === "compact";

  return (
    <div style={{ display: "block", maxWidth: "100%" }}>
      {data.pipelines.map((pipeline) => {
        const stages = pipeline.stages.filter(
          (s) => s.leadsCount > 0
        );
        if (stages.length === 0) return null;

        const maxLeads = Math.max(
          ...stages.map((s) => s.leadsCount)
        );

        const maxHeight = isCompact ? 120 : 200;

        return (
          <motion.div
            key={pipeline.pipelineId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: isCompact ? 16 : 24,
              background: "#0f172a",
              borderRadius: 12,
              color: "#e5e7eb",
              marginBottom: isCompact ? 16 : 32,
              boxShadow:
                "0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            {/* header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: isCompact ? 12 : 20,
              }}
            >
              <h3 style={{ fontSize: isCompact ? 14 : 16 }}>
                📊 {pipeline.pipelineName}
              </h3>

              {!isCompact && (
                <span
                  style={{
                    fontSize: 13,
                    opacity: 0.8,
                  }}
                >
                  ⏱️ {pipeline.avgClosingDays.toFixed(1)} dias
                </span>
              )}
            </div>

            {/* gráfico scrollável */}
              <div
                className="chart-scroll"
                style={{
                  overflowX: "auto",
                  overflowY: "hidden",
                  maxWidth: "100%",
                }}
              >
              <div
                style={{
                  display: "flex",
                  gap: isCompact ? 12 : 24,
                  alignItems: "flex-end",
                  minWidth: "fit-content",
                  height: maxHeight + 40,
                }}
              >
                {stages.map((stage, index) => {
                  const height = Math.min(
                    (stage.leadsCount / maxLeads) * maxHeight,
                    maxHeight
                  );

                  return (
                    <div
                      key={stage.stageId}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flex: "0 0 auto",
                        width: isCompact ? 60 : 90,
                      }}
                    >
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height, opacity: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: index * 0.03,
                          ease: "easeOut",
                        }}
                        style={{
                          width: "100%",
                          background:
                            "linear-gradient(180deg, #38bdf8, #2563eb)",
                          borderRadius: 6,
                          marginBottom: 6,
                        }}
                      />

                      <strong
                        style={{
                          fontSize: isCompact ? 12 : 14,
                        }}
                      >
                        {stage.leadsCount}
                      </strong>

                      <span
                        title={stage.stageName}
                        style={{
                          fontSize: isCompact ? 10 : 12,
                          opacity: 0.75,
                          marginTop: 4,
                          textAlign: "center",
                          whiteSpace: isCompact
                            ? "nowrap"
                            : "normal",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "100%",
                        }}
                      >
                        {isCompact
                          ? stage.stageName.slice(0, 10)
                          : stage.stageName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
