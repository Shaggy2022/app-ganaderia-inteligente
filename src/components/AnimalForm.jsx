import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import { obtenerEspecies } from "../services/especieService";
import { obtenerCategorias } from "../services/categoriaService";
import { registrarAnimal } from "../services/animalService";

// Catálogo para autocompletar precios
const VACCINE_CATALOG = {
  "fiebre aftosa": 1675,
  "brucelosis rb51": 5860,
  "clostridial": 2500,
  "leptospirosis": 5000,
  "carbón bacteridiano": 2000,
};

function AnimalForm({ animalToEdit = null, onClose }) {
  const [form, setForm] = useState({
    id: "",
    raza: "",
    especie: "",
    categoria: "",
    fechaNacimiento: "",
    pesoInicial: "",
    precioVenta: "",
    vaccines: [], // Aquí guardaremos el esquema
  });

  const [especies, setEspecies] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setEspecies(await obtenerEspecies());
      setCategorias(await obtenerCategorias());
    };

    loadData();
  }, []);

  const [errors, setErrors] = useState({});
  const [alertMessage, setAlertMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    if (animalToEdit) {
      setForm({
        ...animalToEdit,
        vaccines: animalToEdit.vaccines || [],
      });
    }
  }, [animalToEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // --- LÓGICA DE VACUNAS ---
  const addVaccine = () => {
    const newVaccine = { id: crypto.randomUUID(), name: "", date: "", price: 0 };
    setForm((prev) => ({ ...prev, vaccines: [...prev.vaccines, newVaccine] }));
  };

  const updateVaccine = (vacId, field, value) => {
    setForm((prev) => ({
      ...prev,
      vaccines: prev.vaccines.map((v) => {
        if (v.id !== vacId) return v;
        const updated = { ...v, [field]: value };

        // Autocompletar precio si coincide con el catálogo
        if (field === "name") {
          const match = VACCINE_CATALOG[value.toLowerCase().trim()];
          if (match) updated.price = match;
        }
        return updated;
      }),
    }));
  };

  const removeVaccine = (vacId) => {
    setForm((prev) => ({
      ...prev,
      vaccines: prev.vaccines.filter((v) => v.id !== vacId),
    }));
  };
  // -------------------------

  const validate = () => {
    const newErrors = {};
    if (!form.id.trim()) newErrors.id = "El ID es obligatorio";
    if (!form.raza.trim()) newErrors.raza = "La raza es obligatoria";
    if (!form.especie) newErrors.especie = "Debe seleccionar una especie";
    if (!form.categoria) newErrors.categoria = "Debe seleccionar una categoría";
    return newErrors;
  };

  const showAlert = (text, type = "success") => {
    setAlertMessage({ text, type });
    setTimeout(() => setAlertMessage({ text: "", type: "" }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {

      // Guardamos en Firebase (limpiamos los IDs temporales de las vacunas si prefieres)
      await registrarAnimal(form, !!animalToEdit);

      showAlert(animalToEdit ? "¡Actualizado!" : "¡Registrado!", "success");
      if (animalToEdit) onClose();
      else setForm({ id: "", raza: "", especie: "", categoria: "", fechaNacimiento: "", pesoInicial: "", precioVenta: "", vaccines: [] });
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <AnimatePresence>
        {alertMessage.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl z-50 ${alertMessage.type === "success" ? "bg-green-500" : "bg-red-500"
              } text-white font-bold`}
          >
            {alertMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={handleSubmit}
        className="bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col gap-6 mt-10 border border-slate-700"
      >
        <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">
          {animalToEdit ? "Editar Expediente" : "Registro de Animal"}
        </h2>

        {/* Datos Básicos en Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-bold uppercase">ID Control:</label>
            <input
              name="id"
              value={form.id}
              onChange={handleChange}
              disabled={!!animalToEdit}
              className={`p-2.5 rounded-lg bg-slate-900 text-white border ${errors.id ? "border-red-500" : "border-slate-600 focus:border-purple-500 outline-none"}`}
            />
            {errors.id && (
              <p className="text-red-500 text-xs mt-1 font-bold">
                {errors.id}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-bold uppercase">Raza / Nombre:</label>
            <input
              name="raza"
              value={form.raza}
              onChange={handleChange}
              className={`p-2.5 rounded-lg bg-slate-900 text-white border ${errors.raza ? "border-red-500" : "border-slate-600 focus:border-purple-500 outline-none"}`}
            />
            {
              errors.raza && (
                <p className="text-red-500 text-xs mt-1 font-bold">
                  {errors.raza}
                </p>
              )
            }
          </div>
        </div>

        {/* Esquema de Vacunación */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">Esquema de Vacunación</h3>
            <button
              type="button"
              onClick={addVaccine}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              + Agregar Vacuna
            </button>
          </div>

          <div className="space-y-3">
            {form.vaccines.map((vac) => (
              <div key={vac.id} className="flex flex-wrap md:flex-nowrap gap-2 items-end bg-slate-800 p-3 rounded-lg border border-slate-700">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-[10px] text-slate-500 block">Vacuna</label>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={vac.name}
                    onChange={(e) => updateVaccine(vac.id, "name", e.target.value)}
                    className="w-full bg-transparent border-b border-slate-600 text-sm text-white focus:border-purple-500 outline-none"
                  />
                </div>
                <div className="w-32">
                  <label className="text-[10px] text-slate-500 block">Fecha</label>
                  <input
                    type="date"
                    value={vac.date}
                    onChange={(e) => updateVaccine(vac.id, "date", e.target.value)}
                    className="w-full bg-transparent border-b border-slate-600 text-sm text-white focus:border-purple-500 outline-none"
                  />
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-slate-500 block">Precio</label>
                  <input
                    type="number"
                    value={vac.price}
                    onChange={(e) => updateVaccine(vac.id, "price", e.target.value)}
                    className="w-full bg-transparent border-b border-slate-600 text-sm text-white focus:border-purple-500 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVaccine(vac.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
            {form.vaccines.length === 0 && (
              <p className="text-center text-slate-500 text-xs py-2 italic">Sin vacunas registradas</p>
            )}
          </div>
        </div>

        <select
          name="especie"
          value={form.especie}
          onChange={handleChange}
          className="p-2 rounded-lg bg-slate-900 text-white"
        >
          <option value="">Seleccione especie</option>
          {especies.map((e) => (
            <option key={e.id} value={e.nombre}>
              {e.nombre}
            </option>
          ))}
        </select>
        {
          errors.especie && (
            <p className="text-red-500 text-xs mt-1 font-bold">
              {errors.especie}
            </p>
          )
        }

        <select
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          className="p-2 rounded-lg bg-slate-900 text-white"
        >
          <option value="">Seleccione categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.nombre}>
              {c.nombre}
            </option>
          ))}
        </select>
        {
          errors.categoria && (
            <p className="text-red-500 text-xs mt-1 font-bold">
              {errors.categoria}
            </p>
          )
        }

        {/* Otros campos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Nacimiento:</label>
            <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} className="p-2 rounded-lg bg-slate-700 text-white text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Peso (kg):</label>
            <input name="pesoInicial" type="number" value={form.pesoInicial} onChange={handleChange} className="p-2 rounded-lg bg-slate-700 text-white text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Precio Venta:</label>
            <input name="precioVenta" type="number" value={form.precioVenta} onChange={handleChange} className="p-2 rounded-lg bg-slate-700 text-white text-sm" />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
          >
            {animalToEdit ? "Guardar Cambios" : "Registrar Animal"}
          </button>
          {animalToEdit && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl transition-all"
            >
              Cancelar
            </button>
          )}
        </div>
      </motion.form>
    </div>
  );
}

export default AnimalForm;