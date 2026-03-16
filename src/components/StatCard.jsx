import { motion } from "framer-motion";

export default function StatCard({ title, value, color }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -3 }}
      className={`bg-slate-800 p-6 rounded-xl shadow-lg border-l-4 border-${color}-500`}
    >
      <h2 className="text-gray-400">{title}</h2>
      <p className="text-3xl font-bold">{value}</p>
    </motion.div>
  );
}