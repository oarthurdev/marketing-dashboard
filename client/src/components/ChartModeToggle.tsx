import { motion } from "framer-motion";

type Mode = "compact" | "detailed";

export function ChartModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  const isCompact = mode === "compact";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        background: "#020617",
        padding: 6,
        borderRadius: 999,
      }}
    >
      <button
        onClick={() => onChange("compact")}
        style={{
          position: "relative",
          padding: "6px 14px",
          borderRadius: 999,
          background: "transparent",
          border: "none",
          color: isCompact ? "#0f172a" : "#94a3b8",
          fontSize: 12,
          cursor: "pointer",
          zIndex: 1,
        }}
      >
        Compacto
      </button>

      <button
        onClick={() => onChange("detailed")}
        style={{
          position: "relative",
          padding: "6px 14px",
          borderRadius: 999,
          background: "transparent",
          border: "none",
          color: !isCompact ? "#0f172a" : "#94a3b8",
          fontSize: 12,
          cursor: "pointer",
          zIndex: 1,
        }}
      >
        Detalhado
      </button>

      {/* fundo animado */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          position: "absolute",
          height: 28,
          width: isCompact ? 86 : 96,
          left: isCompact ? 6 : 92,
          background: "#38bdf8",
          borderRadius: 999,
        }}
      />
    </div>
  );
}
