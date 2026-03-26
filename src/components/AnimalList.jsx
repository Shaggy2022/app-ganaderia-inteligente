import { useEffect, useState } from "react"; 
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";

export default function AnimalList({ setEditingAnimal }) {
  const [animales, setAnimales] = useState([]);
  const [vencidos, setVencidos] = useState([]);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  // --- Obtener la vacuna más reciente ---
  const getLastVaccine = (vaccines = []) => {
    if (!vaccines || vaccines.length === 0) return null;
    const vacunasConFecha = vaccines.filter(v => v.date);
    if (vacunasConFecha.length === 0) return null;
    vacunasConFecha.sort((a, b) => new Date(b.date) - new Date(a.date));
    return vacunasConFecha[0];
  };

  // --- Estado sanitario según la última vacuna ---
  const getStatus = (vaccines = []) => {
    if (!vaccines || vaccines.length === 0) {
      return { txt: "SIN REGISTROS", css: "text-slate-500 border-slate-700" };
    }

    const lastVaccine = getLastVaccine(vaccines);
    if (!lastVaccine || !lastVaccine.date) {
      return { txt: "SIN REGISTROS", css: "text-slate-500 border-slate-700" };
    }

    // Comparar solo la fecha sin horas
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const fechaVac = new Date(lastVaccine.date);
    fechaVac.setHours(0,0,0,0);

    if (fechaVac < hoy) {
      return { txt: "VENCIDA", css: "bg-red-600 text-white animate-pulse" };
    }

    const diffDays = Math.ceil((fechaVac - hoy) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 5) {
      return { txt: "POR VENCER", css: "bg-amber-500 text-white" };
    }

    return { txt: "AL DÍA", css: "bg-emerald-600 text-white" };
  };

  useEffect(() => {
  const unsub = onSnapshot(collection(db, "animales"), (snapshot) => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Creamos copia de vacunas para React
    const animalesConCopias = docs.map(animal => ({
      ...animal,
      vaccines: animal.vaccines ? [...animal.vaccines] : []
    }));

    setAnimales(animalesConCopias);

    // Verificar vencidos usando solo la última vacuna
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);  // Limpiamos la hora para comparar sólo fechas

    const listaVencidos = docs.filter(animal => {
    return animal.vaccines?.some(v => {
      if (!v.date) return false;

      const fechaVac = new Date(v.date);
      fechaVac.setHours(0, 0, 0, 0); // Solo fecha

      return fechaVac < hoy;
    });
  });

    setVencidos(listaVencidos);
    setMostrarAlerta(listaVencidos.length > 0);
  });

  return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este animal y todo su historial permanentemente?")) {
      await deleteDoc(doc(db, "animales", id));
    }
  };

  return (
    <div className="relative p-4 w-full max-w-6xl mx-auto">
      {/* Alerta de Vacunas Vencidas */}
      <AnimatePresence>
        {mostrarAlerta && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-6 right-6 z-50 bg-red-700 text-white p-6 rounded-2xl shadow-2xl border border-red-400 w-80"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black text-xl text-white">⚠️ ATENCIÓN</h3>
              <button onClick={() => setMostrarAlerta(false)} className="text-2xl leading-none hover:scale-110">×</button>
            </div>
            <p className="text-sm font-medium">
              {vencidos.length} animales requieren revisión de vacunas.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-8 bg-slate-800/50 flex justify-between items-center border-b border-slate-800">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
            Panel de Control Ganadero
          </h2>
          <span className="bg-purple-600 text-white px-4 py-1.5 rounded-xl text-xs font-black">
            TOTAL: {animales.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30 text-slate-500 text-[10px] uppercase tracking-[0.2em] border-b border-slate-800">
                <th className="p-6 font-black">Identificación / Raza</th>
                <th className="p-6 font-black text-center">Última Vacuna</th>
                <th className="p-6 font-black text-center">Estado Sanitario</th>
                <th className="p-6 font-black text-right">Gestión</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50">
              {animales.map((animal) => {
                const status = getStatus(animal.vaccines);
                const ultimaVac = getLastVaccine(animal.vaccines);
                const ultimaFecha = ultimaVac ? ultimaVac.date : "---";

                return (
                  <motion.tr 
                    key={animal.id}
                    layout
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="text-white font-black text-lg uppercase tracking-tight group-hover:text-purple-400 transition-colors">
                        {animal.raza}
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        ID: {animal.id}
                      </div>
                    </td>

                    <td className="p-6 text-center">
                      <div className="text-slate-300 font-bold text-sm">
                        {ultimaFecha}
                      </div>
                      <div className="text-[9px] text-slate-600 uppercase font-black">
                        Fecha Registro
                      </div>
                    </td>

                    <td className="p-6 text-center">
                      <span
                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border ${status.css}`}
                      >
                        {status.txt}
                      </span>
                    </td>

                    <td className="p-6">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setEditingAnimal({ ...animal })} // crear copia para evitar referencias antiguas
                          className="bg-white text-slate-900 px-4 py-2 rounded-xl font-black text-[10px] hover:bg-purple-500 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                          VER DETALLES
                        </button>

                        <button 
                          onClick={() => handleDelete(animal.id)}
                          className="bg-red-600/10 text-red-500 p-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {animales.length === 0 && (
            <div className="p-20 text-center text-slate-600 font-black uppercase tracking-widest text-sm">
              No hay animales registrados en la base de datos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}