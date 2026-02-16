import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface StageData {
  position: number;
  stageId: string;
  averageFirstResponseSeconds: number;
}

interface Props {
  data: StageData[];
}

export default function StageResponseChart({ data }: Props) {
  const formatted = data.map((s) => ({
    name: `Stage ${s.position}`,
    tempo: Math.round(s.averageFirstResponseSeconds / 60),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md rounded-2xl shadow-lg p-4 bg-white"
    >
      <h2 className="text-lg font-semibold mb-3 text-center">
        Tempo médio de resposta (min)
      </h2>

      <div className="w-full h-64">
        <ResponsiveContainer>
          <BarChart data={formatted}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="tempo" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}