import { useState } from "react";
import { LeadsPipelineChart } from "./LeadsPipelineChart";
import { ChartModeToggle } from "./ChartModeToggle";

export function LeadsPipelineSection({
  pipelineId,
}: {
  pipelineId: number;
}) {
  const [mode, setMode] = useState<"compact" | "detailed">("detailed");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: 18 }}>Pipeline</h1>

        <ChartModeToggle
          mode={mode}
          onChange={setMode}
        />
      </div>

      <LeadsPipelineChart
        pipelineId={pipelineId}
        mode={mode}
      />
    </div>
  );
}
