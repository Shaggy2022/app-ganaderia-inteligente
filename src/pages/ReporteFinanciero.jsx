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
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lotes, setLotes]       = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [filtroLote, setFiltroLote]       = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [expandido, setExpandido]         = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await getReporteFinanciero({ lote: filtroLote, periodo: filtroPeriodo });
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

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Reporte de Inversión y Rentabilidad</h1>

      {/* Filtros */}
      <div className="bg-slate-800 p-5 rounded-xl shadow-lg mb-6 flex flex-wrap items-center gap-4">
        <span className="text-slate-400 text-sm font-semibold">Lote:</span>
        {["todos", ...lotes].map((l) => (
          <button
            key={l}
            onClick={() => setFiltroLote(l)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all
              ${filtroLote === l
                ? "bg-green-600 border-green-500 text-white"
                : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"}`}
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
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all
              ${filtroPeriodo === p
                ? "bg-green-600 border-green-500 text-white"
                : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"}`}
          >
            {p === "todos" ? "Todos" : p}
          </button>
        ))}

        <button
          onClick={cargar}
          className="ml-auto bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all"
        >
          Actualizar
        </button>
      </div>

      {loading && (
        <div className="text-center py-20 text-slate-400 text-lg">Cargando reporte...</div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 rounded-xl p-5 text-center font-semibold">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 rounded-xl p-5 shadow-lg border-l-4 border-slate-500">
              <p className="text-slate-400 text-sm mb-1">Total Animales</p>
              <p className="text-3xl font-bold text-white">{data.resumen.totalAnimales}</p>
              <p className="text-slate-500 text-xs mt-1">en el período seleccionado</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 shadow-lg border-l-4 border-blue-500">
              <p className="text-slate-400 text-sm mb-1">Capital Invertido</p>
              <p className="text-3xl font-bold text-blue-400">{fmt(data.resumen.capitalTotal)}</p>
              <p className="text-slate-500 text-xs mt-1">suma de todos los costos</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 shadow-lg border-l-4 border-pink-500">
              <p className="text-slate-400 text-sm mb-1">Ventas Estimadas</p>
              <p className="text-3xl font-bold text-pink-400">{fmt(data.resumen.ventaTotal)}</p>
              <p className="text-slate-500 text-xs mt-1">precio de venta total</p>
            </div>
            <div className={`bg-slate-800 rounded-xl p-5 shadow-lg border-l-4 ${data.resumen.utilidadTotal >= 0 ? "border-green-500" : "border-red-500"}`}>
              <p className="text-slate-400 text-sm mb-1">Utilidad Neta</p>
              <p className={`text-3xl font-bold ${data.resumen.utilidadTotal >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmt(data.resumen.utilidadTotal)}
              </p>
              <p className="text-slate-500 text-xs mt-1">Rentabilidad: {data.resumen.rentabilidadTotal}%</p>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold">Detalle por Animal</h2>
              
            </div>

            {data.animales.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                No se encontraron animales con los filtros seleccionados.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                    {["ID Animal", "Raza", "Lote", "Costos Totales", "Precio Venta", "Utilidad", "Rentab.%", "Estado", ""].map((h) => (
                      <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
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
                          onClick={() => setExpandido(expandido === animal.id ? null : animal.id)}
                          className={`border-b border-slate-700 cursor-pointer transition-colors
                            ${idx % 2 === 0 ? "bg-slate-800" : "bg-slate-900"}
                            hover:bg-slate-700`}
                        >
                          <td className="px-5 py-4 font-bold text-green-400">{animal.id}</td>
                          <td className="px-5 py-4 text-slate-300">{animal.raza || "—"}</td>
                          <td className="px-5 py-4">
                            {animal.lote
                              ? <span className="bg-blue-900 text-blue-300 px-3 py-1 rounded-full text-xs font-bold">{animal.lote}</span>
                              : <span className="text-slate-500">—</span>}
                          </td>
                          <td className="px-5 py-4 font-semibold text-blue-400">{fmt(animal.totalCostos)}</td>
                          <td className="px-5 py-4 font-semibold text-pink-400">
                            {animal.precioVenta > 0
                              ? fmt(animal.precioVenta)
                              : <span className="text-slate-500 italic text-sm">Sin precio</span>}
                          </td>
                          <td className={`px-5 py-4 font-bold ${colorRentabilidad(animal.utilidad)}`}>
                            {fmt(animal.utilidad)}
                          </td>
                          <td className={`px-5 py-4 font-bold ${colorRentabilidad(animal.rentabilidad)}`}>
                            {animal.rentabilidad}%
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.clase}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs">
                            {expandido === animal.id ? "▲" : "▼"}
                          </td>
                        </tr>

                        {expandido === animal.id && (
                          <tr key={`detalle-${animal.id}`}>
                            <td colSpan={9} className="bg-slate-900 border-b border-slate-700">
                              <div className="px-8 py-5">
                                <p className="text-sm font-bold text-green-400 mb-3">
                                  Desglose de Costos — {animal.id}
                                </p>
                                {animal.costos.length === 0 ? (
                                  <p className="text-slate-500 text-sm">Sin costos registrados.</p>
                                ) : (
                                  <div className="grid grid-cols-4 gap-3">
                                    {animal.costos.map((c) => (
                                      <div key={c.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                                        <p className="text-slate-400 text-xs uppercase font-bold mb-1">
                                          {c.tipo || c.categoria || c.id}
                                        </p>
                                        <p className="text-blue-400 font-bold text-base">{fmt(c.monto)}</p>
                                        {c.fecha && <p className="text-slate-500 text-xs mt-1">{c.fecha}</p>}
                                        {c.descripcion && <p className="text-slate-400 text-xs mt-1">{c.descripcion}</p>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-700 border-t-2 border-slate-600 font-bold">
                    <td colSpan={3} className="px-5 py-4 text-white">
                      TOTALES ({data.resumen.totalAnimales} animales)
                    </td>
                    <td className="px-5 py-4 text-blue-400">{fmt(data.resumen.capitalTotal)}</td>
                    <td className="px-5 py-4 text-pink-400">{fmt(data.resumen.ventaTotal)}</td>
                    <td className={`px-5 py-4 ${colorRentabilidad(data.resumen.utilidadTotal)}`}>
                      {fmt(data.resumen.utilidadTotal)}
                    </td>
                    <td className={`px-5 py-4 ${colorRentabilidad(data.resumen.rentabilidadTotal)}`}>
                      {data.resumen.rentabilidadTotal}%
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}