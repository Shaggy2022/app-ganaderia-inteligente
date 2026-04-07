import { useState } from "react";
import { motion } from "framer-motion";
import { Pill, Wheat, Package } from "lucide-react";

import MedicamentoList from "../components/MedicamentoList";
import MedicamentoForm from "../components/MedicamentoForm";

export default function Inventory() {
  const [tab, setTab] = useState("medicamentos");

  const tabs = [
    { key: "medicamentos", label: "Medicamentos", icon: Pill },
    { key: "alimentos", label: "Alimentos", icon: Wheat },
    { key: "veterinaria", label: "Veterinaria", icon: Package },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-white">
          INVENTARIO GENERAL
        </h1>
      </div>

      {/* TABS */}
      <div className="flex gap-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all
                ${active
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {tab === "medicamentos" && (
          <>
            <MedicamentoList />
          </>
        )}

        {tab === "alimentos" && (
          <div className="text-slate-400">
            Próximamente inventario de alimentos 🌽
          </div>
        )}

        {tab === "veterinaria" && (
          <div className="text-slate-400">
            Próximamente inventario de veterinaria 🧪
          </div>
        )}
      </motion.div>
    </div>
  );
}