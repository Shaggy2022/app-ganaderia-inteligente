import { useState } from "react";
import { motion } from "framer-motion";
import { Pill, Wheat, Stethoscope } from "lucide-react";  // ← quita CalendarDays

import MedicamentoList from "../components/MedicamentoList";
import MedicamentoForm from "../components/MedicamentoForm";
import VeterinariaTab from "../components/VeterinariaTab";


export default function Inventory() {
  const [tab, setTab] = useState("medicamentos");

  const tabs = [
    { key: "medicamentos", label: "Medicamentos", icon: Pill },
    { key: "alimentos", label: "Alimentos", icon: Wheat },
    { key: "veterinaria", label: "Veterinaria", icon: Stethoscope },
    

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

        {tab === "alimentos" && <AlimentosModule />}

        {tab === "veterinaria" && <VeterinariaTab />
        }
        
      </motion.div>
    </div>
  );
}

/* =========================
   COMPONENTE ALIMENTOS
========================= */
function AlimentosModule() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({
    tipo: "",
    cantidad: "",
    costo: "",
    fecha: "",
    animal: "",
  });

  const [filtro, setFiltro] = useState({
    tipo: "",
    animal: "",
    desde: "",
    hasta: "",
  });

  // 👉 Crear registro
  const handleSubmit = (e) => {
    e.preventDefault();

    const nuevo = {
      ...form,
      cantidad: Number(form.cantidad),
      costo: Number(form.costo),
      total: Number(form.cantidad) * Number(form.costo),
      id: Date.now(),
    };

    setData([...data, nuevo]);

    setForm({
      tipo: "",
      cantidad: "",
      costo: "",
      fecha: "",
      animal: "",
    });
  };

  // 👉 Eliminar
  const eliminar = (id) => {
    setData(data.filter((d) => d.id !== id));
  };

  // 👉 Filtros
  const filtrados = data.filter((d) => {
    return (
      (!filtro.tipo || d.tipo.toLowerCase().includes(filtro.tipo.toLowerCase())) &&
      (!filtro.animal || d.animal.toLowerCase().includes(filtro.animal.toLowerCase())) &&
      (!filtro.desde || d.fecha >= filtro.desde) &&
      (!filtro.hasta || d.fecha <= filtro.hasta)
    );
  });

  // 👉 Gasto total
  const gastoTotal = filtrados.reduce((acc, d) => acc + d.total, 0);

  return (
    <div className="space-y-6">

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-800 p-4 rounded-xl">
        <input
          placeholder="Tipo alimento"
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          className="p-2 rounded bg-slate-700 text-white"
          required
        />

        <input
          type="number"
          placeholder="Cantidad"
          value={form.cantidad}
          onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
          className="p-2 rounded bg-slate-700 text-white"
          required
        />

        <input
          type="number"
          placeholder="Costo unidad"
          value={form.costo}
          onChange={(e) => setForm({ ...form, costo: e.target.value })}
          className="p-2 rounded bg-slate-700 text-white"
          required
        />

        <input
          type="date"
          value={form.fecha}
          onChange={(e) => setForm({ ...form, fecha: e.target.value })}
          className="p-2 rounded bg-slate-700 text-white"
          required
        />

        <input
          placeholder="Animal / Lote"
          value={form.animal}
          onChange={(e) => setForm({ ...form, animal: e.target.value })}
          className="p-2 rounded bg-slate-700 text-white"
          required
        />

        <button className="bg-indigo-600 text-white rounded p-2 font-bold">
          Guardar
        </button>
      </form>

      {/* FILTROS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <input
          placeholder="Filtrar tipo"
          onChange={(e) => setFiltro({ ...filtro, tipo: e.target.value })}
          className="p-2 rounded bg-slate-800 text-white"
        />

        <input
          placeholder="Filtrar animal"
          onChange={(e) => setFiltro({ ...filtro, animal: e.target.value })}
          className="p-2 rounded bg-slate-800 text-white"
        />

        <input
          type="date"
          onChange={(e) => setFiltro({ ...filtro, desde: e.target.value })}
          className="p-2 rounded bg-slate-800 text-white"
        />

        <input
          type="date"
          onChange={(e) => setFiltro({ ...filtro, hasta: e.target.value })}
          className="p-2 rounded bg-slate-800 text-white"
        />
      </div>

      {/* TABLA */}
      <div className="bg-slate-800 rounded-xl p-4">
        <table className="w-full text-sm text-white">
          <thead>
            <tr className="text-left text-slate-400">
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Costo</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Animal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((d) => (
              <tr key={d.id} className="border-t border-slate-700">
                <td>{d.tipo}</td>
                <td>{d.cantidad}</td>
                <td>${d.costo}</td>
                <td className="font-bold text-green-400">${d.total}</td>
                <td>{d.fecha}</td>
                <td>{d.animal}</td>
                <td>
                  <button
                    onClick={() => eliminar(d.id)}
                    className="text-red-400"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAL */}
        <div className="mt-4 text-right font-bold text-green-400">
          Gasto total: ${gastoTotal}
        </div>
      </div>
    </div>
  );
}

