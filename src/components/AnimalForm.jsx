import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { motion } from "framer-motion";

function AnimalForm({ animalToEdit = null, onClose }) {
  const [form, setForm] = useState({
    id: "",
    raza: "",
    fechaNacimiento: "",
    pesoInicial: ""
  });

  // Cuando cambia animalToEdit, actualizamos el formulario
  useEffect(() => {
    if (animalToEdit) {
      setForm(animalToEdit);
    }
  }, [animalToEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.id.trim()) throw new Error("El ID no puede estar vacío");

      // Actualiza el documento existente en Firebase
      const docRef = doc(db, "animales", form.id.trim());
      await setDoc(docRef, {
        id: form.id,
        raza: form.raza,
        fechaNacimiento: form.fechaNacimiento,
        pesoInicial: Number(form.pesoInicial)
      });

      alert(animalToEdit ? "Animal actualizado" : "Animal registrado");

      if (animalToEdit) onClose(); // cerrar formulario de edición
      else setForm({ id: "", raza: "", fechaNacimiento: "", pesoInicial: "" });

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col gap-4"
    >
      <input
        name="id"
        placeholder="ID"
        value={form.id}
        onChange={handleChange}
        disabled={!!animalToEdit} // no se puede cambiar el ID al editar
        className="p-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <input
        name="raza"
        placeholder="Raza"
        value={form.raza}
        onChange={handleChange}
        className="p-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <input
        type="date"
        name="fechaNacimiento"
        value={form.fechaNacimiento}
        onChange={handleChange}
        className="p-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <input
        name="pesoInicial"
        placeholder="Peso inicial (kg)"
        value={form.pesoInicial}
        onChange={handleChange}
        className="p-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        type="submit"
        className={`${
          animalToEdit ? "bg-yellow-500 hover:bg-yellow-600" : "bg-purple-600 hover:bg-purple-700"
        } text-white font-bold py-2 rounded-lg`}
      >
        {animalToEdit ? "Actualizar" : "Registrar"}
      </motion.button>

      {animalToEdit && (
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
        >
          Cancelar
        </button>
      )}
    </motion.form>
  );
}

export default AnimalForm;