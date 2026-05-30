import { useState, useEffect } from "react";
import AnimalForm from "../components/AnimalForm";
import AnimalList from "../components/AnimalList";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function Animals() {

  // =========================
  // STATES
  // =========================

  const [showForm, setShowForm] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showFoodForm, setShowFoodForm] = useState(false);

  // REGISTROS FIREBASE
  const [foodRecords, setFoodRecords] = useState([]);

  // FORMULARIO
  const [foodData, setFoodData] = useState({
    animal: "",
    alimento: "",
    cantidad: "",
    fecha: "",
    observaciones: "",
    edad: "",
    peso: "",
  });

  // =========================
  // PESO ESPERADO POR EDAD
  // =========================

  const expectedWeights = [
    { edad: 3, pesoMin: 90 },
    { edad: 6, pesoMin: 150 },
    { edad: 12, pesoMin: 250 },
    { edad: 18, pesoMin: 350 },
    { edad: 24, pesoMin: 450 },
  ];

  // =========================
  // GUÍA DE VACUNACIÓN
  // =========================

  const vaccinationGuide = [
    {
      edad: "0 - 3 meses",
      vacuna: "Calostro",
      notas: "Protección inicial en las primeras 6 horas.",
    },
    {
      edad: "3 - 4 meses",
      vacuna: "Brucelosis (RB51)",
      notas: "Obligatoria en hembras. Una vez en la vida.",
    },
    {
      edad: "4 - 8 meses",
      vacuna: "Fiebre Aftosa",
      notas: "Obligatoria. Refuerzo cada 6 meses (Ciclos ICA).",
    },
    {
      edad: "4 - 8 meses",
      vacuna: "Carbón Bacteridiano",
      notas: "Refuerzo anual obligatorio.",
    },
    {
      edad: "6 meses +",
      vacuna: "Clostridiales",
      notas: "Aplicar, repetir a los 30 días y luego anual.",
    },
    {
      edad: "8 meses +",
      vacuna: "Leptospirosis",
      notas: "Previene problemas reproductivos y abortos.",
    },
    {
      edad: "Adultas",
      vacuna: "Refuerzos Anuales",
      notas:
        "Aftosa, Clostridiales, Leptospirosis y Carbón.",
    },
  ];

  // =========================
  // CARGAR REGISTROS
  // =========================

  useEffect(() => {
    obtenerRegistros();
  }, []);

  // =========================
  // OBTENER DATOS FIREBASE
  // =========================

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

  // =========================
  // VALIDAR PESO
  // =========================

  const verificarPeso = (edad, peso) => {

    const regla = expectedWeights.find(
      (item) => edad <= item.edad
    );

    if (!regla) return false;

    return peso < regla.pesoMin;
  };

  // =========================
  // GUARDAR REGISTRO
  // =========================

  const handleFoodSubmit = async (e) => {

    e.preventDefault();

    if (
      !foodData.animal ||
      !foodData.fecha ||
      !foodData.edad ||
      !foodData.peso
    ) {
      alert("Complete todos los campos obligatorios");
      return;
    }

    try {

      // VALIDACIÓN DE PESO
      const alertaPeso = verificarPeso(
        Number(foodData.edad),
        Number(foodData.peso)
      );

      // GUARDAR EN FIREBASE
      await addDoc(
        collection(db, "registroAlimentacion"),
        {
          animal: foodData.animal,
          alimento: foodData.alimento,
          cantidad: Number(foodData.cantidad),
          fecha: foodData.fecha,
          observaciones: foodData.observaciones,
          edad: Number(foodData.edad),
          peso: Number(foodData.peso),
          alertaPeso,
          createdAt: new Date(),
        }
      );

      if (alertaPeso) {

        alert(
          "⚠️ ALERTA: El animal no alcanza el peso esperado para su edad."
        );

      } else {

        alert("✅ Registro guardado correctamente");

      }

      // RECARGAR REGISTROS
      obtenerRegistros();

      // LIMPIAR FORMULARIO
      setFoodData({
        animal: "",
        alimento: "",
        cantidad: "",
        fecha: "",
        observaciones: "",
        edad: "",
        peso: "",
      });

      // CERRAR MODAL
      setShowFoodForm(false);

    } catch (error) {

      console.log(error);

      alert("❌ Error al guardar");

    }
  };

  return (

    <div className="p-6 bg-slate-950 min-h-screen">

      <div className="max-w-6xl mx-auto">

        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <header className="flex justify-between items-center mb-8">

          <h1 className="text-4xl font-black text-white">
            GESTIÓN GANADERA
          </h1>

          <div className="flex gap-3">

            {/* GUÍA */}
            <button
              onClick={() => setShowGuide(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              📖 Guía de Vacunación
            </button>

            {/* NUEVO ANIMAL */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl font-bold"
            >
              + Nuevo Animal
            </button>

            {/* ALIMENTACIÓN */}
            <button
              onClick={() => setShowFoodForm(true)}
              className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-xl font-bold"
            >
              🍽️ Alimentación
            </button>

          </div>
        </header>

        {/* ========================= */}
        {/* MODAL GUÍA */}
        {/* ========================= */}

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

                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    Esquema Sugerido (Bovinos)
                  </h2>

                  <button
                    onClick={() => setShowGuide(false)}
                    className="text-slate-400 hover:text-white text-2xl"
                  >
                    ✕
                  </button>

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

                          <td className="py-3 px-2 text-white font-bold">
                            {item.edad}
                          </td>

                          <td className="py-3 px-2 text-slate-300">
                            {item.vacuna}
                          </td>

                          <td className="py-3 px-2 text-slate-500 italic text-xs">
                            {item.notas}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </motion.div>

            </div>

          )}

        </AnimatePresence>

        {/* ========================= */}
        {/* FORMULARIO ANIMAL */}
        {/* ========================= */}

        
        {(showForm || editingAnimal) && (
          <AnimalForm
            animalToEdit={editingAnimal}
            onClose={() => {
              setShowForm(false);
              setEditingAnimal(null);
            }}
          />
        )}

        {/* ========================= */}
        {/* LISTA ANIMALES */}
        {/* ========================= */}

        <AnimalList setEditingAnimal={setEditingAnimal} />

        {/* ========================= */}
        {/* REGISTROS */}
        {/* ========================= */}

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
                className="bg-slate-800 p-4 rounded-xl mb-4 border border-slate-700"
              >

                <p className="text-white font-bold text-lg">
                  🐄 {item.animal}
                </p>

                <div className="grid md:grid-cols-2 gap-2 mt-3">

                  <p className="text-slate-300">
                    🍽️ Alimento: {item.alimento}
                  </p>

                  <p className="text-slate-300">
                    ⚖️ Cantidad: {item.cantidad} kg
                  </p>

                  <p className="text-slate-300">
                    📅 Fecha: {item.fecha}
                  </p>

                  <p className="text-slate-300">
                    📆 Edad: {item.edad} meses
                  </p>

                  <p className="text-slate-300">
                    🐮 Peso: {item.peso} kg
                  </p>

                </div>

                <p className="text-slate-500 italic mt-3">
                  {item.observaciones}
                </p>

                {/* ALERTA */}

                {item.alertaPeso && (

                  <div className="mt-4 bg-red-600/20 border border-red-500 p-4 rounded-xl">

                    <p className="text-red-400 font-black text-lg">
                      ⚠️ ALERTA DE BAJO PESO
                    </p>

                    <p className="text-red-300 text-sm mt-1">
                      El animal no alcanza el peso esperado para su edad.
                    </p>

                  </div>

                )}

              </div>

            ))

          )}

        </div>

        {/* ========================= */}
        {/* MODAL ALIMENTACIÓN */}
        {/* ========================= */}

        <AnimatePresence>

          {showFoodForm && (

            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-900 p-6 rounded-3xl w-full max-w-md"
              >

                {/* HEADER */}

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

                {/* FORM */}

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

                  {/* EDAD */}

                  <input
                    type="number"
                    placeholder="Edad en meses"
                    value={foodData.edad}
                    onChange={(e) =>
                      setFoodData({
                        ...foodData,
                        edad: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-xl bg-slate-800 text-white"
                  />

                  {/* PESO */}

                  <input
                    type="number"
                    placeholder="Peso actual en kg"
                    value={foodData.peso}
                    onChange={(e) =>
                      setFoodData({
                        ...foodData,
                        peso: e.target.value,
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