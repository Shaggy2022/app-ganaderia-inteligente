import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";

export default function AnimalList({ setEditingAnimal }) {
  const [animales, setAnimales] = useState([]);
  const [vencidos, setVencidos] = useState([]);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "animales"), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnimales(docs);

      const hoy = new Date();
      const listaVencidos = docs.filter(
        a => a.fechaVacunacion && new Date(a.fechaVacunacion) < hoy
      );

      if (listaVencidos.length > 0) {
        setVencidos(listaVencidos);
        setMostrarAlerta(true);
      }
    });
    return () => unsub();
  }, []);

  const getStatus = (fecha) => {
    if (!fecha) return { txt: "SIN DATOS", css: "text-slate-500 border-slate-500" };
    const dif = Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
    if (dif < 0) return { txt: "VENCIDA", css: "bg-red-600 text-white animate-pulse" };
    if (dif <= 5) return { txt: "POR VENCER", css: "bg-amber-500 text-white" };
    return { txt: "AL DÍA", css: "bg-emerald-600 text-white" };
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este registro?")) {
      await deleteDoc(doc(db, "animales", id));
    }
  };

  return (
    <div className="relative p-4 w-full max-w-6xl mx-auto">
      <AnimatePresence>
        {mostrarAlerta && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-6 right-6 z-50 bg-red-700 text-white p-6 rounded-2xl shadow-2xl border border-red-400 w-80"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black text-xl">⚠️ ALERTA</h3>
              <button onClick={() => setMostrarAlerta(false)} className="text-2xl leading-none">×</button>
            </div>
            <p className="text-sm font-medium">
              Hay {vencidos.length} animales con vacunas vencidas.
            </p>
            <div className="mt-2 text-xs opacity-80 italic">
              {vencidos.map(v => v.raza).join(", ")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-8 bg-slate-800/50 flex justify-between items-center">
          <h2 className="text-3xl font-black text-white tracking-tighter">
            LISTA GANADO
          </h2>
          <span className="bg-slate-700 text-slate-300 px-4 py-1 rounded-full text-sm font-bold">
            Total: {animales.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-800">
                <th className="p-5 font-black">Animal / Raza</th>
                <th className="p-5 font-black text-center">Fecha Vacuna</th>
                <th className="p-5 font-black text-center">Estado Alarma</th>
                <th className="p-5 font-black text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {animales.map((animal) => {
                const status = getStatus(animal.fechaVacunacion);

                return (
                  <motion.tr 
                    key={animal.id}
                    layout
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="p-5">
                      <div className="text-white font-bold text-lg">
                        {animal.raza}
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        {animal.id}
                      </div>
                    </td>

                    <td className="p-5 text-center font-mono text-slate-300">
                      {animal.fechaVacunacion || "---"}
                    </td>

                    <td className="p-5 text-center">
                      {/* ✅ AQUÍ ESTABA EL ERROR */}
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter border ${status.css}`}
                      >
                        {status.txt}
                      </span>
                    </td>

                    <td className="p-5">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setEditingAnimal(animal)}
                          className="bg-blue-600/10 text-blue-400 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                        >
                          EDITAR
                        </button>

                        <button 
                          onClick={() => handleDelete(animal.id)}
                          className="bg-red-600/10 text-red-500 p-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                        >
                          ELIMINAR
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}