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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cantidad = Number(form.cantidad);
      const costoUnitario = Number(form.costoUnitario);
      const costoTotal = cantidad * costoUnitario;

      const data = { ...form, cantidad, costoUnitario, costoTotal, updatedAt: new Date().toISOString() };

      if (initialData?.id) {
        await updateMedicamento(initialData.id, data);
        onSuccess && onSuccess(true); // edición
      } else {
        await addMedicamento({ ...data, createdAt: new Date().toISOString() });
        onSuccess && onSuccess(false); // creación
      }

      setForm({ nombre: "", fechaUso: "", cantidad: "", costoUnitario: "", animalId: "" });

    } catch (error) {
      console.error(error);
      alert("Error al guardar medicamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="text-xs text-slate-400 font-bold">Nombre del medicamento:</label>      
      <input
        name="nombre"
        placeholder="Nombre del medicamento"
        value={form.nombre}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
      />

      <label className="text-xs text-slate-400 font-bold">Fecha de uso:</label>      
      <input
        type="date"
        name="fechaUso"
        value={form.fechaUso}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
      />

      <label className="text-xs text-slate-400 font-bold">Cantidad:</label>      
      <input
        type="number"
        name="cantidad"
        placeholder="Cantidad"
        value={form.cantidad}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
      />

      <label className="text-xs text-slate-400 font-bold">Costo unitario:</label>      
      <input
        type="number"
        name="costoUnitario"
        placeholder="Costo unitario"
        value={form.costoUnitario}
        onChange={handleChange}
        required
        className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
      />

      <label className="text-xs text-slate-400 font-bold">ID del animal:</label>      
      <input
        name="animalId"
        placeholder="ID animal (opcional)"
        value={form.animalId}
        onChange={handleChange}
        className="w-full p-3 rounded-xl bg-slate-800 text-white border border-slate-700"
      />

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