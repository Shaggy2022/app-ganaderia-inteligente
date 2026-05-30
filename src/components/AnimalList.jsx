import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function AnimalList({ setEditingAnimal }) {
  const [animales, setAnimales] = useState([]);
  const [vencidos, setVencidos] = useState([]);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  const navigate = useNavigate();

  // Última vacuna
  const getLastVaccine = (vaccines = []) => {
    if (!vaccines.length) return null;

    const ordenadas = vaccines.filter(v => v.date);
    ordenadas.sort((a, b) => new Date(b.date) - new Date(a.date));
    return ordenadas[0];
  };

  // Estado sanitario
  const getStatus = (vaccines = []) => {
    if (!vaccines.length) {
      return { txt: "SIN REGISTROS", css: "text-gray-500" };
    }

    const last = getLastVaccine(vaccines);
    if (!last) return { txt: "SIN REGISTROS", css: "text-gray-500" };

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const fecha = new Date(last.date);
    fecha.setHours(0,0,0,0);

    if (fecha < hoy) {
      return { txt: "VENCIDA", css: "bg-red-600 text-white" };
    }

    const diff = Math.ceil((fecha - hoy)/(1000*60*60*24));

    if (diff <= 5) {
      return { txt: "POR VENCER", css: "bg-yellow-500 text-black" };
    }

    return { txt: "AL DÍA", css: "bg-green-600 text-white" };
  };

  // Cargar animales
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "animales"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAnimales(lista);

      // detectar vencidos
      const hoy = new Date();
      hoy.setHours(0,0,0,0);

      const venc = lista.filter(a =>
        a.vaccines?.some(v => new Date(v.date) < hoy)
      );

      setVencidos(venc);
      setMostrarAlerta(venc.length > 0);
    });

    return () => unsub();
  }, []);

  // Eliminar
  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este animal?")) {
      await deleteDoc(doc(db, "animales", id));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-white">

      {/* ALERTA */}
      <AnimatePresence>
        {mostrarAlerta && (
          <motion.div
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 200, opacity: 0 }}
            className="fixed top-5 right-5 bg-red-600 p-4 rounded shadow"
          >
            ⚠️ {vencidos.length} animales con vacunas vencidas
          </motion.div>
        )}
      </AnimatePresence>

      {/* TÍTULO */}
      <h1 className="text-3xl font-bold mb-6">
        Lista de Animales
      </h1>

      {/* TABLA */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900 text-sm">
            <tr>
              <th className="p-3">Animal</th>
              <th>Última vacuna</th>
              <th>Especie</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th className="text-right pr-4">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {animales.map(animal => {
              const ultima = getLastVaccine(animal.vaccines);
              const estado = getStatus(animal.vaccines);

              return (
                <tr key={animal.id} className="border-b border-slate-700">

                  <td className="p-3">
                    {animal.raza}
                    <div className="text-xs text-gray-400">
                      ID: {animal.id}
                    </div>
                  </td>

                  <td className="text-center">
                    {ultima ? ultima.date : "---"}
                  </td>

                  <td className="text-center">
                    {animal.especie}
                  </td>

                  <td className="text-center">
                    {animal.categoria}
                  </td>

                  <td className="text-center">
                    <span className={`px-2 py-1 rounded ${estado.css}`}>
                      {estado.txt}
                    </span>
                  </td>

                  <td className="text-right pr-4 space-x-2">

                    {/* 🔥 IR A HISTORIAL */}
                    <button
                      onClick={() => navigate(`/animal/${animal.id}`)}
                      className="bg-purple-600 px-3 py-1 rounded"
                    >
                      VER HISTORIAL
                    </button>

                    <button
                      onClick={() => setEditingAnimal({ ...animal })}
                      className="bg-blue-500 px-3 py-1 rounded"
                    >
                      EDITAR
                    </button>

                    <button
                      onClick={() => handleDelete(animal.id)}
                      className="bg-red-600 px-3 py-1 rounded"
                    >
                      ELIMINAR
                    </button>

                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>

        {animales.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No hay animales registrados
          </div>
        )}
      </div>
    </div>
  );
}