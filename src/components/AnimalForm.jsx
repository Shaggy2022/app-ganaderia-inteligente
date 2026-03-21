import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";

function AnimalForm({ animalToEdit = null, onClose }) {
  const [form, setForm] = useState({
    id: "",
    raza: "",
    fechaNacimiento: "",
    pesoInicial: "",
    fechaVacunacion: ""
  });

  const [errors, setErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState({ text: "", type: "" }); // type: "success" | "error"

  useEffect(() => {
    if (animalToEdit) {
      setForm(animalToEdit);
    }
  }, [animalToEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors(prev => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.id.trim()) newErrors.id = "El ID es obligatorio";
    if (!form.raza.trim()) newErrors.raza = "La raza o nombre del animal es obligatorio";
    return newErrors;
  };

  const showAlert = (text, type = "success") => {
    setAlertMessage({ text, type });
    setTimeout(() => setAlertMessage({ text: "", type: "" }), 4000); // desaparece después de 4s
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const docRef = doc(db, "animales", form.id.trim());

      // Verificar si el ID ya existe (solo al registrar)
      if (!animalToEdit) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          showAlert("El ID ya existe, elige otro", "error");
          return;
        }
      }

      // Guardar o actualizar
      await setDoc(docRef, {
        id: form.id,
        raza: form.raza,
        fechaNacimiento: form.fechaNacimiento,
        pesoInicial: form.pesoInicial ? Number(form.pesoInicial) : null,
        fechaVacunacion: form.fechaVacunacion || null
      });

      showAlert(animalToEdit ? "¡Animal actualizado con éxito!" : "¡Animal registrado con éxito!", "success");

      if (animalToEdit) onClose();
      else setForm({ id: "", raza: "", fechaNacimiento: "", pesoInicial: "", fechaVacunacion: "" });

    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <div className="relative">
      {/* Mensaje dinámico (éxito o error) */}
      <AnimatePresence>
        {alertMessage.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-0 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50 ${
              alertMessage.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {alertMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col gap-4 mt-12"
      >
        {/* ID */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-bold">ID:</label>
          <input
            name="id"
            placeholder="ID"
            value={form.id}
            onChange={handleChange}
            disabled={!!animalToEdit}
            className={`p-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 ${errors.id ? "focus:ring-red-500" : "focus:ring-purple-500"}`}
          />
          {errors.id && <span className="text-red-500 text-xs">{errors.id}</span>}
        </div>

        {/* Raza */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-bold">Raza o Animal:</label>
          <input
            name="raza"
            placeholder="Raza"
            value={form.raza}
            onChange={handleChange}
            className={`p-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 ${errors.raza ? "focus:ring-red-500" : "focus:ring-purple-500"}`}
          />
          {errors.raza && <span className="text-red-500 text-xs">{errors.raza}</span>}
        </div>

        {/* Fecha de nacimiento */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-bold">Fecha de nacimiento:</label>
          <input
            type="date"
            name="fechaNacimiento"
            value={form.fechaNacimiento}
            onChange={handleChange}
            className="p-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Peso inicial */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-bold">Peso inicial:</label>
          <input
            name="pesoInicial"
            placeholder="Peso inicial (kg)"
            value={form.pesoInicial}
            onChange={handleChange}
            className="p-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Fecha de vacunación */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-bold">Fecha de vacunación:</label>
          <input
            type="date"
            name="fechaVacunacion"
            value={form.fechaVacunacion || ""}
            onChange={handleChange}
            className="p-2 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Botones */}
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
    </div>
  );
}

export default AnimalForm;