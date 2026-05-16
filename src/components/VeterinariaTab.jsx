// src/components/VeterinariaTab.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { AnimatePresence } from "framer-motion";
import ModalProgramarVisita from "./ModalProgramarVisita";
import CalendarioVeterinario from "../pages/CalendarioVeterinario";
import {
  addServicioVet,
  updateServicioVet,
  deleteServicioVet,
  TIPOS_SERVICIO,
} from "../services/veterinariaService";

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

const hoy = () => new Date().toISOString().split("T")[0];

const FORM_VACIO = {
  animalId: "",
  tipoServicio: TIPOS_SERVICIO[0],
  fecha: hoy(),
  cantidad: 1,
  costo: "",
  descripcion: "",
};

const BADGE = {
  "Consulta veterinaria": "bg-blue-900 text-blue-300",
  "Vacunación":           "bg-green-900 text-green-300",
  "Desparasitación":      "bg-yellow-900 text-yellow-300",
  "Cirugía":              "bg-red-900 text-red-300",
  "Otro tratamiento":     "bg-slate-700 text-slate-300",
};

export default function VeterinariaTab() {
  const [servicios, setServicios]   = useState([]);
  const [animales, setAnimales]     = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(FORM_VACIO);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [alert, setAlert]           = useState("");
  const [showProgramar, setShowProgramar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); 
  const [vistaActiva, setVistaActiva] = useState("registros");
  ("registros"); // "registros" | "calendario"

  // Escucha en tiempo real los servicios veterinarios
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "serviciosVeterinarios"),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Ordena por fecha descendente
        docs.sort((a, b) => (b.fecha > a.fecha ? 1 : -1));
        setServicios(docs);
      }
    );
    return () => unsub();
  }, []);

  // Carga lista de animales para el selector
  useEffect(() => {
    getDocs(collection(db, "animales")).then((snap) => {
      setAnimales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const costoTotal =
    form.cantidad && form.costo
      ? Number(form.cantidad) * Number(form.costo)
      : null;

  const abrirNuevo = () => {
    setForm(FORM_VACIO);
    setEditing(null);
    setError("");
    setShowModal(true);
  };

  const abrirEditar = (s) => {
    setForm({
      animalId:     s.animalId,
      tipoServicio: s.tipoServicio,
      fecha:        s.fecha,
      cantidad:     s.cantidad,
      costo:        s.costo,
      descripcion:  s.descripcion || "",
    });
    setEditing(s);
    setError("");
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditing(null);
    setError("");
  };

  const showAlerta = (msg) => {
    setAlert(msg);
    setTimeout(() => setAlert(""), 3000);
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.animalId) { setError("Debes seleccionar un animal."); return; }
    if (!form.costo || Number(form.costo) <= 0) { setError("El costo debe ser mayor a 0."); return; }
    if (!form.cantidad || Number(form.cantidad) <= 0) { setError("La cantidad debe ser mayor a 0."); return; }

    setLoading(true);
    try {
      const data = {
        ...form,
        cantidad:   Number(form.cantidad),
        costo:      Number(form.costo),
        costoTotal: Number(form.cantidad) * Number(form.costo),
      };

      if (editing) {
        await updateServicioVet(editing.id, data, editing.costoId);
        showAlerta("Servicio actualizado y costo sincronizado ✅");
      } else {
        await addServicioVet(data);
        showAlerta("Servicio registrado y costo agregado al animal 🐄");
      }
      cerrarModal();
    } catch (err) {
      console.error(err);
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = (s) => {
  setConfirmDelete(s);
};

  const confirmarEliminar = async () => {
    if (!confirmDelete) return;
    await deleteServicioVet(confirmDelete.id, confirmDelete.animalId, confirmDelete.costoId);
    showAlerta("Servicio eliminado y costo actualizado ✅");
    setConfirmDelete(null);
  };
  

  const totalGastado = servicios.reduce((acc, s) => acc + (s.costoTotal || 0), 0);

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden mt-6">

      
      {/* HEADER */}
<div className="p-8 bg-slate-800/50">
  <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
    <div>
      <h2 className="text-3xl font-black text-white">VETERINARIA</h2>
      <p className="text-slate-400 text-sm mt-1">
        Total invertido: <span className="text-emerald-400 font-bold">{fmt(totalGastado)}</span>
      </p>
    </div>
    <div className="flex gap-4 items-center">
      <span className="bg-slate-700 px-4 py-1 rounded-full text-sm text-white">
        Registros: {servicios.length}
      </span>
      <button
        onClick={abrirNuevo}
        className="bg-indigo-600 px-4 py-2 rounded-xl text-white font-bold hover:bg-indigo-500 transition-all"
      >
        + Registrar servicio
      </button>
      <button
        onClick={() => setShowProgramar(true)}
        className="bg-slate-600 px-4 py-2 rounded-xl text-white font-bold hover:bg-slate-500 transition-all"
      >
        📅 Programar visita
      </button>
    </div>
  </div>

  {/* PESTAÑAS INTERNAS */}
  <div className="flex gap-3">
    <button
      onClick={() => setVistaActiva("registros")}
      className={`px-5 py-2 rounded-xl text-sm font-bold transition-all
        ${vistaActiva === "registros"
          ? "bg-indigo-600 text-white"
          : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}
    >
      📋 Registros
    </button>
    <button
      onClick={() => setVistaActiva("calendario")}
      className={`px-5 py-2 rounded-xl text-sm font-bold transition-all
        ${vistaActiva === "calendario"
          ? "bg-indigo-600 text-white"
          : "bg-slate-700 text-slate-400 hover:bg-slate-600"}`}
    >
      📅 Mi calendario veterinario
    </button>
  </div>
</div>

      {/* ALERTA */}
      {/* CONTENIDO SEGÚN PESTAÑA */}
      {vistaActiva === "registros" && (
        <>
          {/* ALERTA */}
          {alert && (
            <div className="mx-8 mt-4 bg-green-900 border border-green-700 text-green-300 rounded-xl px-5 py-3 text-sm font-semibold">
              {alert}
            </div>
          )}

          {/* TABLA */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-800 uppercase tracking-wider">
                  <th className="p-5 text-left">Tipo de servicio</th>
                  <th className="p-5 text-center">Animal</th>
                  <th className="p-5 text-center">Fecha</th>
                  <th className="p-5 text-center">Cantidad</th>
                  <th className="p-5 text-center">Costo unitario</th>
                  <th className="p-5 text-center">Costo total</th>
                  <th className="p-5 text-left">Descripción</th>
                  <th className="p-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servicios.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-14 text-center text-slate-500">
                      No hay servicios veterinarios registrados aún.
                    </td>
                  </tr>
                ) : (
                  servicios.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${BADGE[s.tipoServicio] || "bg-slate-700 text-slate-300"}`}>
                          {s.tipoServicio}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <span className="bg-blue-900 text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                          {s.animalId}
                        </span>
                      </td>
                      <td className="p-5 text-center text-slate-300">{s.fecha}</td>
                      <td className="p-5 text-center text-slate-300">{s.cantidad}</td>
                      <td className="p-5 text-center text-slate-400">{fmt(s.costo)}</td>
                      <td className="p-5 text-center text-emerald-400 font-bold">{fmt(s.costoTotal)}</td>
                      <td className="p-5 text-slate-400 text-sm">{s.descripcion || "—"}</td>
                      <td className="p-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(s)}
                            className="bg-blue-600/10 text-blue-400 px-3 py-1 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm"
                          >
                            EDITAR
                          </button>
                          <button
                            onClick={() => handleEliminar(s)}
                            className="bg-red-600/10 text-red-400 px-3 py-1 rounded-xl hover:bg-red-600 hover:text-white transition-all text-sm"
                          >
                            ELIMINAR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* CALENDARIO */}
      {vistaActiva === "calendario" && (
        <div className="p-4">
          <CalendarioVeterinario />
        </div>
      )}

      
      

      {/* MODAL FORMULARIO */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="bg-slate-900 p-6 rounded-2xl w-full max-w-lg border border-slate-700 max-h-screen overflow-y-auto"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              {/* Header modal */}
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-white font-bold text-xl">
                  {editing ? "Editar servicio" : "Registrar servicio veterinario"}
                </h3>
                <button onClick={cerrarModal} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Animal */}
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    Animal <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="animalId"
                    value={form.animalId}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
                  >
                    <option value="">Selecciona un animal</option>
                    {animales.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.id} — {a.raza || "sin raza"}
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
                    Fecha <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
                  />
                </div>

                {/* Cantidad y costo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">
                      Cantidad <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="cantidad"
                      value={form.cantidad}
                      onChange={handleChange}
                      required
                      min="1"
                      placeholder="Ej: 2"
                      className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">
                      Costo unitario <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="costo"
                      value={form.costo}
                      onChange={handleChange}
                      required
                      min="0"
                      placeholder="Ej: 80000"
                      className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
                    />
                  </div>
                </div>

                {/* Preview costo total */}
                {costoTotal !== null && (
                  <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Costo total:</span>
                    <span className="text-emerald-400 font-bold text-lg">{fmt(costoTotal)}</span>
                  </div>
                )}

                {/* Descripción */}
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Ej: Vacuna triple bovina, dosis anual"
                    className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700 resize-none"
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-red-400 text-sm font-semibold">⚠️ {error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all"
                >
                  {loading ? "Guardando..." : editing ? "Actualizar servicio" : "Guardar servicio"}
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
      {/* MODAL PROGRAMAR VISITA */}
      {showProgramar && (
        <ModalProgramarVisita
          animales={animales}
          onGuardar={() => setShowProgramar(false)}
          onCerrar={() => setShowProgramar(false)}
        />
      )}

      

    {/* MODAL CONFIRMACIÓN ELIMINAR */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700 text-center">
            <div className="text-4xl mb-4">🗑️</div>
            <h3 className="text-white font-bold text-lg mb-2">¿Eliminar servicio?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Se eliminará{" "}
              <span className="text-white font-semibold">{confirmDelete.tipoServicio}</span>{" "}
              del animal{" "}
              <span className="text-white font-semibold">{confirmDelete.animalId}</span>{" "}
              junto con su costo vinculado. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={confirmarEliminar}
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl font-bold transition-all"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-xl font-bold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
