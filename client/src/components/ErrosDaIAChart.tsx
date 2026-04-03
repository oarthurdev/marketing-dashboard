import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";

interface Props {
  stageId: string;
  title?: string;
  dateFrom?: string;
  dateTo?: string;
}

export default function KommoStageChart({ stageId, title = "Erros da IA", dateFrom, dateTo }: Props) {
  const [value, setValue] = useState(0);
  const [display, setDisplay] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        query.set('stageId', stageId);
        if (dateFrom) query.set('dateFrom', dateFrom);
        if (dateTo) query.set('dateTo', dateTo);
        const res = await fetch(`/kommo/leads-by-stage-month?${query.toString()}`);
        const data = await res.json();
        setValue(data.total || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [stageId, dateFrom, dateTo]);

  useEffect(() => {
    const controls = animate(display, value, {
      duration: 0.8,
      onUpdate(v) {
        setDisplay(Math.floor(v));
      }
    });
    return () => controls.stop();
  }, [value]);

  return (
    <div className="w-full rounded-2xl bg-zinc-900 text-white p-6 shadow-xl border border-zinc-800">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-zinc-300"><center>{title}</center></h3>
        <span className="text-xs text-zinc-500">mês atual</span>
      </div>

      {/* main metric */}
      <div className="flex flex-col items-center justify-center py-4">
        <motion.div
          key={display}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold tracking-tight"
        >
          {loading ? "—" : display}
        </motion.div>

        <span className="text-xs text-zinc-500 mt-2">quantidade de leads</span>
      </div>

      {/* subtle indicator bar */}
      <div className="mt-6">
        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
          {!loading && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1 }}
              className="h-full bg-white"
            />
          )}

          {loading && (
            <motion.div
              className="h-full w-1/3 bg-zinc-600"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
