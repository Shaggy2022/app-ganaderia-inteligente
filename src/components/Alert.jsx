import { motion, AnimatePresence } from "framer-motion";

export default function Alert({ show, message, type = "success", onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className={`fixed top-6 right-6 z-50 p-5 rounded-2xl shadow-2xl text-white w-80
            ${type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
        >
          <div className="flex justify-between items-center">
            <span className="font-bold">{message}</span>
            <button onClick={onClose} className="text-xl">×</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}