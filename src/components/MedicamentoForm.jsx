import { useState, useEffect } from "react";
import { addMedicamento, updateMedicamento } from "../services/medicamentoService";

const MedicamentoForm = ({ onSuccess, initialData }) => {
  const [form, setForm] = useState({
    nombre: "",
    fechaUso: "",
    cantidad: "",
    costoUnitario: "",
    animalId: ""
  });

  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        nombre: initialData.nombre || "",
        fechaUso: initialData.fechaUso || "",
        cantidad: initialData.cantidad || "",
        costoUnitario: initialData.costoUnitario || "",
        animalId: initialData.animalId || ""
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔴 VALIDACIONES (HU12)
  const validar = () => {
    const nuevosErrores = {};

    const cantidad = Number(form.cantidad);
    const costoUnitario = Number(form.costoUnitario);
    const hoy = new Date().toISOString().split("T")[0];

    if (!form.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    }

    if (!form.fechaUso) {
      nuevosErrores.fechaUso = "La fecha es obligatoria";
    } else if (form.fechaUso > hoy) {
      nuevosErrores.fechaUso = "No puede ser una fecha futura";
    }

    if (!form.cantidad || cantidad <= 0) {
      nuevosErrores.cantidad = "Debe ser mayor a 0";
    }

    if (!form.costoUnitario || costoUnitario <= 0) {
      nuevosErrores.costoUnitario = "Debe ser mayor a 0";
    }

    return nuevosErrores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const erroresValidados = validar();
    setErrores(erroresValidados);

    if (Object.keys(erroresValidados).length > 0) return;

    setLoading(true);

    try {
      const cantidad = Number(form.cantidad);
      const costoUnitario = Number(form.costoUnitario);
      const costoTotal = cantidad * costoUnitario;

      const data = {
        ...form,
        cantidad,
        costoUnitario,
        costoTotal,
        updatedAt: new Date().toISOString()
      };

      if (initialData?.id) {
        await updateMedicamento(initialData.id, data);
        onSuccess && onSuccess(true);
      } else {
        await addMedicamento({
          ...data,
          createdAt: new Date().toISOString()
        });
        onSuccess && onSuccess(false);
      }

      setForm({
        nombre: "",
        fechaUso: "",
        cantidad: "",
        costoUnitario: "",
        animalId: ""
      });

      setErrores({});

    } catch (error) {
      console.error(error);
      alert("Error al guardar medicamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* NOMBRE */}
      <div>
        <label className="text-xs text-slate-400 font-bold">Nombre del medicamento:</label>
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
        />
        {errores.nombre && <p className="text-red-400 text-xs">{errores.nombre}</p>}
      </div>

      {/* FECHA */}
      <div>
        <label className="text-xs text-slate-400 font-bold">Fecha de uso:</label>
        <input
          type="date"
          name="fechaUso"
          value={form.fechaUso}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
        />
        {errores.fechaUso && <p className="text-red-400 text-xs">{errores.fechaUso}</p>}
      </div>

      {/* CANTIDAD */}
      <div>
        <label className="text-xs text-slate-400 font-bold">Cantidad:</label>
        <input
          type="number"
          name="cantidad"
          value={form.cantidad}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
        />
        {errores.cantidad && <p className="text-red-400 text-xs">{errores.cantidad}</p>}
      </div>

      {/* COSTO */}
      <div>
        <label className="text-xs text-slate-400 font-bold">Costo unitario:</label>
        <input
          type="number"
          name="costoUnitario"
          value={form.costoUnitario}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
        />
        {errores.costoUnitario && <p className="text-red-400 text-xs">{errores.costoUnitario}</p>}
      </div>

      {/* ANIMAL */}
      <div>
        <label className="text-xs text-slate-400 font-bold">ID del animal:</label>
        <input
          name="animalId"
          value={form.animalId}
          onChange={handleChange}
          className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
        />
        {errores.animalId && <p className="text-red-400 text-xs">{errores.animalId}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold"
      >
        {loading ? "Guardando..." : initialData ? "Actualizar medicamento" : "Guardar medicamento"}
      </button>
    </form>
  );
};

export default MedicamentoForm;