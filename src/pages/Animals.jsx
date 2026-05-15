import { useState } from "react";
import AnimalForm from "../components/AnimalForm";
import AnimalList from "../components/AnimalList";
import { motion, AnimatePresence } from "framer-motion";

export default function Animals() {
  const [showForm, setShowForm] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [showGuide, setShowGuide] = useState(false); // Estado para la guía

  const vaccinationGuide = [
    { edad: "0 - 3 meses", vacuna: "Calostro", notas: "Protección inicial en las primeras 6 horas." },
    { edad: "3 - 4 meses", vacuna: "Brucelosis (RB51)", notas: "Obligatoria en hembras. Una vez en la vida." },
    { edad: "4 - 8 meses", vacuna: "Fiebre Aftosa", notas: "Obligatoria. Refuerzo cada 6 meses (Ciclos ICA)." },
    { edad: "4 - 8 meses", vacuna: "Carbón Bacteridiano", notas: "Refuerzo anual obligatorio." },
    { edad: "6 meses +", vacuna: "Clostridiales", notas: "Aplicar, repetir a los 30 días y luego anual." },
    { edad: "8 meses +", vacuna: "Leptospirosis", notas: "Previene problemas reproductivos y abortos." },
    { edad: "Adultas", vacuna: "Refuerzos Anuales", notas: "Aftosa, Clostridiales, Leptospirosis y Carbón." },
  ];

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl font-black text-white tracking-tighter">GESTIÓN GANADERA</h1>

          <div className="flex gap-3">
            {/* Botón de Guía Informativa */}
            <button
              onClick={() => setShowGuide(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <span className="text-lg">📖</span> Guía de Vacunación
            </button>

            {!editingAnimal && (
              <button
                onClick={() => setShowForm(!showForm)}
                className={`${showForm ? "bg-red-600/20 text-red-500 border-red-500/50" : "bg-purple-600 text-white"
                  } font-bold px-5 py-2.5 rounded-xl border transition-all shadow-lg active:scale-95`}
              >
                {showForm ? "Cerrar" : "+ Nuevo Animal"}
              </button>
            )}
          </div>
        </header>

        {/* Modal de Guía de Vacunación */}
        <AnimatePresence>
          {showGuide && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Esquema Sugerido (Bovinos)</h2>
                  <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-white text-2xl">✕</button>
                </div>

                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-purple-400 text-[10px] uppercase font-black tracking-widest">
                        <th className="pb-4 px-2">Edad</th>
                        <th className="pb-4 px-2">Vacuna</th>
                        <th className="pb-4 px-2">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {vaccinationGuide.map((item, idx) => (
                        <tr key={idx} className="text-sm">
                          <td className="py-3 px-2 text-white font-bold">{item.edad}</td>
                          <td className="py-3 px-2 text-slate-300">{item.vacuna}</td>
                          <td className="py-3 px-2 text-slate-500 italic text-xs">{item.notas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 bg-slate-800/30 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Consulte siempre con su médico veterinario y los ciclos oficiales del ICA.</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Formularios */}
        <div className="mb-10">
          {showForm && !editingAnimal && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <AnimalForm onClose={() => setShowForm(false)} />
            </motion.div>
          )}

          {editingAnimal && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <AnimalForm
                animalToEdit={editingAnimal}
                onClose={() => setEditingAnimal(null)}
              />
            </motion.div>
          )}
        </div>

        {/* Lista siempre visible */}
        <AnimalList setEditingAnimal={setEditingAnimal} />
      </div>
    </div>
  );
}