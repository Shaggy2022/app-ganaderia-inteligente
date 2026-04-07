// src/pages/ReporteFinanciero.jsx
import { useEffect, useState, useCallback } from "react";
import {
  getReporteFinanciero,
  getLotesDisponibles,
  getPeriodosDisponibles,
} from "../services/financieroService";

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

const badgeUtilidad = (valor) => {
  if (valor > 0) return { label: "Ganancia", clase: "bg-green-900 text-green-300" };
  if (valor < 0) return { label: "Pérdida", clase: "bg-red-900 text-red-300" };
  return { label: "Neutro", clase: "bg-slate-700 text-slate-300" };
};

const colorRentabilidad = (v) => (v >= 0 ? "text-green-400" : "text-red-400");

export default function ReporteFinanciero() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [filtroLote, setFiltroLote] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [expandido, setExpandido] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await getReporteFinanciero({
        lote: filtroLote,
        periodo: filtroPeriodo,
      });
      setData(resultado);
    } catch {
      setError("No se pudo cargar el reporte. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }, [filtroLote, filtroPeriodo]);

  useEffect(() => {
    getLotesDisponibles().then(setLotes);
    getPeriodosDisponibles().then(setPeriodos);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Reporte de Inversión y Rentabilidad
      </h1>

      {/* Filtros */}
      <div className="bg-slate-800 p-5 rounded-xl shadow-lg mb-6 flex flex-wrap items-center gap-4">
        <span className="text-slate-400 text-sm font-semibold">Lote:</span>
        {["todos", ...lotes].map((l) => (
          <button
            key={l}
            onClick={() => setFiltroLote(l)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border
              ${
                filtroLote === l
                  ? "bg-green-600 border-green-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              }`}
          >
            {l === "todos" ? "Todos" : l}
          </button>
        ))}

        <span className="text-slate-600">|</span>

        <span className="text-slate-400 text-sm font-semibold">Período:</span>
        {["todos", ...periodos].map((p) => (
          <button
            key={p}
            onClick={() => setFiltroPeriodo(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border
              ${
                filtroPeriodo === p
                  ? "bg-green-600 border-green-500 text-white"
                  : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
              }`}
          >
            {p === "todos" ? "Todos" : p}
          </button>
        ))}

        <button
          onClick={cargar}
          className="ml-auto bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-bold"
        >
          Actualizar
        </button>
      </div>

      {/* Estados */}
      {loading && (
        <div className="text-center py-20 text-slate-400">
          Cargando reporte...
        </div>
      )}

      {error && (
        <div className="bg-red-900 text-red-300 p-5 rounded-xl text-center">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Tabla */}
          <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700 text-xs uppercase text-slate-400">
                  {[
                    "ID Animal",
                    "Raza",
                    "Lote",
                    "Costos Base",
                    "Medicamentos",
                    "Total",
                    "Precio Venta",
                    "Utilidad",
                    "Rentab.%",
                    "Estado",
                    "",
                  ].map((h) => (
                    <th key={h} className="px-5 py-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.animales.map((animal, idx) => {
                  const badge = badgeUtilidad(animal.utilidad);

                  return (
                    <>
                      <tr
                        key={animal.id}
                        onClick={() =>
                          setExpandido(
                            expandido === animal.id ? null : animal.id
                          )
                        }
                        className={`cursor-pointer ${
                          idx % 2 === 0 ? "bg-slate-800" : "bg-slate-900"
                        } hover:bg-slate-700`}
                      >
                        <td className="px-5 py-4 text-green-400 font-bold">
                          {animal.id}
                        </td>

                        <td className="px-5 py-4">{animal.raza || "—"}</td>

                        <td className="px-5 py-4">{animal.lote || "—"}</td>

                        <td className="px-5 py-4 text-blue-300">
                          {fmt(animal.totalCostosBase)}
                        </td>

                        <td className="px-5 py-4 text-purple-300">
                          {fmt(animal.totalMedicamentos)}
                        </td>

                        <td className="px-5 py-4 text-blue-400 font-bold">
                          {fmt(animal.totalCostos)}
                        </td>

                        <td className="px-5 py-4 text-pink-400">
                          {fmt(animal.precioVenta)}
                        </td>

                        <td
                          className={`px-5 py-4 font-bold ${colorRentabilidad(
                            animal.utilidad
                          )}`}
                        >
                          {fmt(animal.utilidad)}
                        </td>

                        <td
                          className={`px-5 py-4 ${colorRentabilidad(
                            animal.rentabilidad
                          )}`}
                        >
                          {animal.rentabilidad}%
                        </td>

                        <td>
                          <span className={badge.clase}>{badge.label}</span>
                        </td>

                        <td>{expandido === animal.id ? "▲" : "▼"}</td>
                      </tr>

                      {/* 🔥 DETALLE MEJORADO */}
                      {expandido === animal.id && (
                        <tr>
                          <td colSpan={11} className="bg-slate-900">
                            <div className="px-8 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* COSTOS */}
                                <div>
                                  <p className="text-green-400 font-bold mb-3">
                                    Costos
                                  </p>

                                  {animal.costos.length === 0 ? (
                                    <p className="text-slate-500 text-sm italic">
                                      No hay costos registrados
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                      {animal.costos.map((c) => (
                                        <div key={c.id} className="bg-slate-800 p-3 rounded-lg">
                                          <p className="text-xs text-slate-400">
                                            {c.tipo || c.categoria || "Costo"}
                                          </p>
                                          <p className="text-blue-400 font-bold">
                                            {fmt(c.monto)}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* MEDICAMENTOS */}
                                <div>
                                  <p className="text-purple-400 font-bold mb-3">
                                    Medicamentos
                                  </p>

                                  {!animal.medicamentos || animal.medicamentos.length === 0 ? (
                                    <p className="text-slate-500 text-sm italic">
                                      No hay medicamentos registrados
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                      {animal.medicamentos.map((m) => (
                                        <div key={m.id} className="bg-slate-800 p-3 rounded-lg">
                                          <p className="text-xs text-slate-400">
                                            {m.nombre || "Medicamento"}
                                          </p>
                                          <p className="text-purple-400 font-bold">
                                            {fmt(m.costoTotal)}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}