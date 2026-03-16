import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { motion } from "framer-motion";

export default function AnimalList({ setEditingAnimal }) {
  const [animales, setAnimales] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "animales"), (snapshot) => {
      setAnimales(snapshot.docs.map(doc => doc.data()));
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    if (confirm(`¿Seguro que quieres eliminar el animal ${id}?`)) {
      await deleteDoc(doc(db, "animales", id));
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 mt-6 shadow-lg">
      <h2 className="text-xl font-bold mb-4">Lista de Animales</h2>
      <table className="w-full text-left border-collapse">
        <thead className="text-gray-400 border-b border-slate-700">
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Raza</th>
            <th className="p-2">Fecha Nacimiento</th>
            <th className="p-2">Peso Inicial</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {animales.map(animal => (
            <motion.tr
              key={animal.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border-b border-slate-700 hover:bg-slate-700/30"
            >
              <td className="p-2">{animal.id}</td>
              <td className="p-2">{animal.raza}</td>
              <td className="p-2">{animal.fechaNacimiento}</td>
              <td className="p-2">{animal.pesoInicial} kg</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => setEditingAnimal(animal)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(animal.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}