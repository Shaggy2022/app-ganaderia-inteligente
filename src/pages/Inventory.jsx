import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pill, Wheat, Stethoscope } from "lucide-react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

import MedicamentoList from "../components/MedicamentoList";
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
      <h1 className="text-3xl font-black text-white">
        INVENTARIO GENERAL
      </h1>

      {/* TABS */}
      <div className="flex gap-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold
                ${active
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400"}`}
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </div>

      <motion.div key={tab}>
        {tab === "medicamentos" && <MedicamentoList />}
        {tab === "alimentos" && <AlimentosModule />}
        {tab === "veterinaria" && <VeterinariaTab />}
      </motion.div>
    </div>
  );
}

/* =========================
   ALIMENTOS CON SELECT DE ANIMALES
========================= */
function AlimentosModule() {
  const [data, setData] = useState([]);
  const [animales, setAnimales] = useState([]);

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

  // ✅ CARGAR ALIMENTOS
  useEffect(() => {
    cargarAlimentos();
  }, []);

  // ✅ CARGAR ANIMALES
  useEffect(() => {
    const cargarAnimales = async () => {
      const snap = await getDocs(collection(db, "animales"));
      const lista = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setAnimales(lista);
    };

    cargarAnimales();
  }, []);

  const cargarAlimentos = async () => {
    const snap = await getDocs(collection(db, "alimentacion"));
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setData(lista);
  };

  // ✅ GUARDAR
  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevo = {
      tipo: form.tipo,
      cantidad: Number(form.cantidad),
      costo: Number(form.costo),
      total: Number(form.cantidad) * Number(form.costo),
      fecha: form.fecha,
      animalId: form.animal,
    };

    await addDoc(collection(db, "alimentacion"), nuevo);

    await cargarAlimentos();

    setForm({
      tipo: "",
      cantidad: "",
      costo: "",
      fecha: "",
      animal: "",
    });
  };

  // ✅ ELIMINAR
  const eliminar = async (id) => {
    await deleteDoc(doc(db, "alimentacion", id));
    await cargarAlimentos();
  };

  const filtrados = data.filter((d) => {
    return (
      (!filtro.tipo ||
        d.tipo.toLowerCase().includes(filtro.tipo.toLowerCase())) &&
      (!filtro.animal ||
        (d.animalId || "")
          .toLowerCase()
          .includes(filtro.animal.toLowerCase())) &&
      (!filtro.desde || d.fecha >= filtro.desde) &&
      (!filtro.hasta || d.fecha <= filtro.hasta)
    );
  });

  const gastoTotal = filtrados.reduce((acc, d) => acc + d.total, 0);

  return (
    <div className="space-y-6">

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-800 p-4 rounded-xl"
      >
        <input
          placeholder="Tipo alimento"
          value={form.tipo}
          onChange={(e) =>
            setForm({ ...form, tipo: e.target.value })
          }
          className="p-2 rounded bg-slate-700 text-white"
          required
        />

        <input
          type="number"
          placeholder="Cantidad"
          value={form.cantidad}
          onChange={(e) =>
            setForm({ ...form, cantidad: e.target.value })
          }
          className="p-2 rounded bg-slate-700 text-white"
          required
        />

        <input
          type="number"
          placeholder="Costo unidad"
          value={form.costo}
          onChange={(e) =>
            setForm({ ...form, costo: e.target.value })
          }
          className="p-2 rounded bg-slate-700 text-white"
          required
        />

        <input
          type="date"
          value={form.fecha}
          onChange={(e) =>
            setForm({ ...form, fecha: e.target.value })
          }
          className="p-2 rounded bg-slate-700 text-white"
          required
        />

        {/* ✅ SELECT DE ANIMALES */}
        <select
          value={form.animal}
          onChange={(e) =>
            setForm({ ...form, animal: e.target.value })
          }
          className="p-2 rounded bg-slate-700 text-white"
          required
        >
          <option value="">Selecciona un animal</option>

          {animales.map((a) => (
            <option key={a.id} value={a.id}>
              {a.id} - {a.raza}
            </option>
          ))}
        </select>

        <button className="bg-indigo-600 text-white rounded p-2 font-bold">
          Guardar
        </button>
      </form>

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
                <td className="text-green-400 font-bold">
                  ${d.total}
                </td>
                <td>{d.fecha}</td>
                <td>{d.animalId}</td>
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

        <div className="mt-4 text-right text-green-400 font-bold">
          Gasto total: ${gastoTotal}
        </div>
      </div>
    </div>
  );
}