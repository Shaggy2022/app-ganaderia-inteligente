import { useState, useEffect } from "react";
import AnimalForm from "../components/AnimalForm";
import AnimalList from "../components/AnimalList";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function Animals() {

  const [showForm, setShowForm] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [showGuide, setShowGuide] = useState(false); // Estado para la guía
  // MODAL ALIMENTACIÓN
  const [showFoodForm, setShowFoodForm] = useState(false);

  // REGISTROS TRAÍDOS DE FIREBASE
  const [foodRecords, setFoodRecords] = useState([]);

  // FORMULARIO
  const [foodData, setFoodData] = useState({
    animal: "",
    alimento: "",
    cantidad: "",
    fecha: "",
    observaciones: "",
  });

  // CARGAR REGISTROS
  useEffect(() => {
    obtenerRegistros();
  }, []);

  // TRAER DATOS FIREBASE
  const obtenerRegistros = async () => {

    const querySnapshot = await getDocs(
      collection(db, "registroAlimentacion")
    );

    const registros = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setFoodRecords(registros);
  };

  // GUARDAR REGISTRO
  const handleFoodSubmit = async (e) => {

    e.preventDefault();

    if (!foodData.animal || !foodData.fecha) {
      alert("Animal y fecha son obligatorios");
      return;
    }

    try {

      await addDoc(collection(db, "registroAlimentacion"), {
        animal: foodData.animal,
        alimento: foodData.alimento,
        cantidad: Number(foodData.cantidad),
        fecha: foodData.fecha,
        observaciones: foodData.observaciones,
        createdAt: new Date(),
      });

      alert("Registro guardado correctamente");

      // RECARGAR REGISTROS
      obtenerRegistros();

      // LIMPIAR FORMULARIO
      setFoodData({
        animal: "",
        alimento: "",
        cantidad: "",
        fecha: "",
        observaciones: "",
      });

      // CERRAR MODAL
      setShowFoodForm(false);

    } catch (error) {

      console.log(error);

      alert("Error al guardar");
    }
  };

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

        {/* HEADER */}
        <header className="flex justify-between items-center mb-8">

          <h1 className="text-4xl font-black text-white">
            GESTIÓN GANADERA
          </h1>

          <div className="flex gap-3">

            {/* Botón de Guía Informativa */}
            <button
              onClick={() => setShowGuide(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <span className="text-lg">📖</span> Guía de Vacunación
            </button>

            {/* NUEVO ANIMAL */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 text-white px-5 py-2 rounded-xl font-bold"
            >
              + Nuevo Animal
            </button>

            {/* ALIMENTACIÓN */}
            <button
              onClick={() => setShowFoodForm(true)}
              className="bg-green-600 text-white px-5 py-2 rounded-xl font-bold"
            >
              🍽️ Alimentación
            </button>

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

        {/* FORMULARIO ANIMAL */}
        {(showForm || editingAnimal) && (
          <AnimalForm
            animalToEdit={editingAnimal}
            onClose={() => {
              setShowForm(false);
              setEditingAnimal(null);
            }}
          />
        )}


        {/* LISTA ANIMALES */}
        <AnimalList setEditingAnimal={setEditingAnimal} />

        {/* REGISTROS ALIMENTACIÓN */}
        <div className="mt-8 bg-slate-900 p-6 rounded-3xl">

          <h2 className="text-2xl font-bold text-white mb-5">
            Registros de Alimentación
          </h2>

          {foodRecords.length === 0 ? (

            <p className="text-slate-400">
              No hay registros aún
            </p>

          ) : (

            foodRecords.map((item) => (

              <div
                key={item.id}
                className="bg-slate-800 p-4 rounded-xl mb-3"
              >

                <p className="text-white font-bold">
                  🐄 {item.animal}
                </p>

                <p className="text-slate-300">
                  Alimento: {item.alimento}
                </p>

                <p className="text-slate-300">
                  Cantidad: {item.cantidad} kg
                </p>

                <p className="text-slate-400">
                  Fecha: {item.fecha}
                </p>

                <p className="text-slate-500 italic">
                  {item.observaciones}
                </p>

              </div>
            ))
          )}
        </div>

        {/* MODAL ALIMENTACIÓN */}
        <AnimatePresence>

          {showFoodForm && (

            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-900 p-6 rounded-3xl w-full max-w-md"
              >

                {/* HEADER MODAL */}
                <div className="flex justify-between items-center mb-5">

                  <h2 className="text-white text-2xl font-bold">
                    Registro Alimentación
                  </h2>

                  <button
                    onClick={() => setShowFoodForm(false)}
                    className="text-white text-xl"
                  >
                    ✕
                  </button>

                </div>

                {/* FORMULARIO */}
                <form
                  onSubmit={handleFoodSubmit}
                  className="space-y-4"
                >

                  {/* ANIMAL */}
                  <input
                    type="text"
                    placeholder="Nombre del animal"
                    value={foodData.animal}
                    onChange={(e) =>
                      setFoodData({
                        ...foodData,
                        animal: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 text-white"
                  />

                  {/* ALIMENTO */}
                  <input
                    type="text"
                    placeholder="Tipo de alimento"
                    value={foodData.alimento}
                    onChange={(e) =>
                      setFoodData({
                        ...foodData,
                        alimento: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 text-white"
                  />

                  {/* CANTIDAD */}
                  <input
                    type="number"
                    placeholder="Cantidad en kg"
                    value={foodData.cantidad}
                    onChange={(e) =>
                      setFoodData({
                        ...foodData,
                        cantidad: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 text-white"
                  />

                  {/* FECHA */}
                  <input
                    type="date"
                    value={foodData.fecha}
                    onChange={(e) =>
                      setFoodData({
                        ...foodData,
                        fecha: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 text-white"
                  />

                  {/* OBSERVACIONES */}
                  <textarea
                    placeholder="Observaciones"
                    value={foodData.observaciones}
                    onChange={(e) =>
                      setFoodData({
                        ...foodData,
                        observaciones: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 text-white h-24"
                  />

                  {/* BOTÓN */}
                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                  >
                    Guardar Registro
                  </button>

                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}