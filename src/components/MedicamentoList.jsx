import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import MedicamentoForm from "./MedicamentoForm";
import Alert from "./Alert";

export default function MedicamentoList() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [alert, setAlert] = useState({ show: false, message: "" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "medicamentos"), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedicamentos(docs);
    });

    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar medicamento?")) {
      await deleteDoc(doc(db, "medicamentos", id));
      setAlert({ show: true, message: "Medicamento eliminado ✅" });
      setTimeout(() => setAlert({ show: false, message: "" }), 3000);
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden mt-6">

      {/* HEADER */}
      <div className="p-8 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-3xl font-black text-white">MEDICAMENTOS</h2>

        <div className="flex gap-4">
          <span className="bg-slate-700 px-4 py-1 rounded-full text-sm text-white">
            Total: {medicamentos.length}
          </span>

          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="bg-indigo-600 px-4 py-2 rounded-xl text-white font-bold"
          >
            + Registrar medicamento
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-800">
              <th className="p-5 text-left">Nombre</th>
              <th className="p-5 text-center">Fecha</th>
              <th className="p-5 text-center">Cantidad</th>
              <th className="p-5 text-center">Costo</th>
              <th className="p-5 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {medicamentos.map((m) => (
              <motion.tr key={m.id} className="hover:bg-slate-800/40">
                <td className="p-5 text-white font-bold">{m.nombre}</td>
                <td className="p-5 text-center text-slate-300">{m.fechaUso}</td>
                <td className="p-5 text-center">{m.cantidad}</td>
                <td className="p-5 text-center text-emerald-400 font-bold">${m.costoTotal}</td>
                <td className="p-5">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setEditing(m); setShowModal(true); }}
                      className="bg-blue-600/10 text-blue-400 px-3 py-1 rounded-xl hover:bg-blue-600 hover:text-white"
                    >
                      EDITAR
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="bg-red-600/10 text-red-400 px-3 py-1 rounded-xl hover:bg-red-600 hover:text-white"
                    >
                      ELIMINAR
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 p-6 rounded-2xl w-full max-w-lg border border-slate-700"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="flex justify-between mb-4">
                <h3 className="text-white font-bold text-xl">
                  {editing ? "Editar medicamento" : "Registrar medicamento"}
                </h3>
                <button onClick={() => setShowModal(false)}>✕</button>
              </div>

              <MedicamentoForm
                initialData={editing}
                onSuccess={(isEdit) => {
                  setShowModal(false);
                  setEditing(null);
                  setAlert({
                    show: true,
                    message: isEdit
                      ? "Medicamento actualizado correctamente ✅"
                      : "Medicamento registrado correctamente 💊"
                  });
                  setTimeout(() => setAlert({ show: false, message: "" }), 3000);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALERT */}
      <Alert show={alert.show} message={alert.message} onClose={() => setAlert({ show: false, message: "" })} />

    </div>
  );
}