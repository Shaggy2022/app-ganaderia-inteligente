// src/components/ModalProgramarVisita.jsx
// Modal que se agrega a VeterinariaTab para agendar eventos futuros — HU10
//
// USO en VeterinariaTab.jsx:
//   1. Importar:  import ModalProgramarVisita from "./ModalProgramarVisita";
//   2. Agregar estado: const [showProgramar, setShowProgramar] = useState(false);
//   3. Agregar botón junto al de "Registrar servicio":
//        <button onClick={() => setShowProgramar(true)} className="...">
//          + Programar visita
//        </button>
//   4. Renderizar al final del componente:
//        {showProgramar && (
//          <ModalProgramarVisita
//            animales={animales}
//            onGuardar={() => { setShowProgramar(false); }}
//            onCerrar={() => setShowProgramar(false)}
//          />
//        )}

import { useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { addEventoVet } from "../services/eventosVetService";
import { TIPOS_SERVICIO } from "../services/veterinariaService";

const hoy = () => new Date().toISOString().split("T")[0];

const FORM_VACIO = {
  animalId:        "",
  animalNombre:    "",
  lote:            "",
  tipoServicio:    TIPOS_SERVICIO[0],
  fechaProgramada: hoy(),
  veterinario:     "",
  notas:           "",
};

export default function ModalProgramarVisita({ animales = [], onGuardar, onCerrar }) {
  const [form, setForm]       = useState(FORM_VACIO);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (e) => {
    setError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleAnimal = (e) => {
    const animal = animales.find((a) => a.id === e.target.value);
    setForm((f) => ({
      ...f,
      animalId:     animal?.id           || "",
      animalNombre: animal?.nombre || animal?.raza || animal?.id || "",
      lote:         animal?.lote         || "",
    }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.animalId)        { setError("Selecciona un animal."); return; }
    if (!form.fechaProgramada) { setError("Ingresa la fecha programada."); return; }
    if (form.fechaProgramada < hoy()) {
      setError("La fecha debe ser igual o posterior a hoy.");
      return;
    }

    setLoading(true);
    try {
      await addEventoVet(form);
      onGuardar();
    } catch (err) {
      console.error(err);
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-lg border border-slate-700 max-h-screen overflow-y-auto">

        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold text-xl">Programar visita veterinaria</h3>
          <button onClick={onCerrar} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="space-y-4">

          {/* Animal */}
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">
              Animal <span className="text-red-400">*</span>
            </label>
            <select
              name="animalId"
              value={form.animalId}
              onChange={handleAnimal}
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
            >
              <option value="">Selecciona un animal</option>
              {animales.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.nombre || a.raza || "sin nombre"} {a.lote ? `(${a.lote})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de servicio */}
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">
              Tipo de servicio <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_SERVICIO.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipoServicio: t }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                    ${form.tipoServicio === t
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">
              Fecha programada <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="fechaProgramada"
              value={form.fechaProgramada}
              min={hoy()}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
            />
          </div>

          {/* Veterinario */}
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Veterinario</label>
            <input
              type="text"
              name="veterinario"
              value={form.veterinario}
              onChange={handleChange}
              placeholder="Ej: Dr. Ramírez"
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Notas (opcional)</label>
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              rows={2}
              placeholder="Ej: Vacuna triple bovina, dosis anual"
              className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm font-semibold">⚠️ {error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar en calendario"}
          </button>
        </div>
      </div>
    </div>
  );
}
