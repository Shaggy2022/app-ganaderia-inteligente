// src/pages/Costs.jsx
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  getCostosAnimal,
  agregarCosto,
  eliminarCosto,
  editarCosto,
  TIPOS_COSTO,
} from "../services/costosService";
import { decrementarStockMedicamento } from "../services/medicamentoService";
import { restaurarStockMedicamento } from "../services/medicamentoService";

const fetchMedicamentos = async () => {
  const snap = await getDocs(collection(db, "medicamentos"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

const hoy = () => new Date().toISOString().split("T")[0];

const FORM_VACIO = { tipo: TIPOS_COSTO[0], monto: "", fecha: hoy(), descripcion: "",itemInventarioId: "", cantidadUsada: "" };

export default function Costs() {
  const [animales, setAnimales] = useState([]);
  const [animalSel, setAnimalSel] = useState(null);
  const [costos, setCostos] = useState([]);
  const [loadingCostos, setLoadingCostos] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [tipoAcumulado, setTipoAcumulado] = useState("mensual");
  const [medicamentos, setMedicamentos] = useState([]);
  const [costoOriginal, setCostoOriginal] = useState(null);
  const [filtros, setFiltros] = useState({
    tipo: "",
    fechaInicio: "",
    fechaFin: "",
  });

  useEffect(() => {
    // Supongamos que tienes un servicio para traer medicamentos
    fetchMedicamentos().then((data) => setMedicamentos(data));
  }, []);

  // Cargar animales
  useEffect(() => {
    getDocs(collection(db, "animales")).then((snap) => {
      setAnimales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Cargar costos cuando se selecciona animal
  useEffect(() => {
    if (!animalSel) return;
    setLoadingCostos(true);
    getCostosAnimal(animalSel.id)
      .then((data) => {
        const ordenados = data.sort((a, b) => (b.fecha > a.fecha ? 1 : -1));
        setCostos(ordenados);
      })
      .finally(() => setLoadingCostos(false));
  }, [animalSel]);

  const calcularAcumulado = (lista, tipo = "mensual") => {
    const acc = {};

    lista.forEach((c) => {
      const fecha = new Date(c.fecha);
      let clave;

      if (tipo === "mensual") {
        clave = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
      } else {
        clave = `${fecha.getFullYear()}`;
      }

      acc[clave] = (acc[clave] || 0) + Number(c.monto);
    });

    return acc;
  };

  const costosFiltrados = costos.filter((c) => {
    return (
      (!filtros.tipo || c.tipo === filtros.tipo) &&
      (!filtros.fechaInicio || c.fecha >= filtros.fechaInicio) &&
      (!filtros.fechaFin || c.fecha <= filtros.fechaFin)
    );
  });

  const acumulados = calcularAcumulado(costosFiltrados, tipoAcumulado);

  const totalCostos = costosFiltrados.reduce(
    (acc, c) => acc + Number(c.monto),
    0
  );

  const handleSubmit = async () => {
    setError("");

    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) {
      setError("El monto debe ser un número mayor a 0.");
      return;
    }
    if (!form.fecha) {
      setError("La fecha es obligatoria.");
      return;
    }

    if (form.tipo === "Medicamentos" && (!form.cantidadUsada || Number(form.cantidadUsada) <= 0)) {
      setError("La cantidad usada debe ser mayor a 0.");
    return;
    }  

    //Guardar
    setGuardando(true);
    try {
    // Si es medicamento y queremos autoasignar monto según inventario
    let montoFinal = Number(form.monto);
    if (form.tipo === "Medicamentos" && form.itemInventarioId) {
      const medicamento = medicamentos.find(m => m.id === form.itemInventarioId);
      if (medicamento && medicamento.valorUnitario) {
        montoFinal = Number(form.cantidadUsada) * Number(medicamento.valorUnitario);
      }
    }

    try {
      
      const costoData = {
        ...form,
        cantidadUsada: Number(form.cantidadUsada) || 0,
        monto: montoFinal,
        // ✅ asegurarte de guardar el ID del medicamento
        itemInventarioId: form.itemInventarioId || null
      };

      if (editandoId) {
        // Traer el costo anterior
        const costoAnterior = costos.find(c => c.id === editandoId);

        await editarCosto(animalSel.id, editandoId, costoData);

        // 🔥 SOLO SI ES MEDICAMENTO
        if (form.tipo === "Medicamentos" && form.itemInventarioId) {
          const anterior = Number(costoAnterior?.cantidadUsada || 0);
          const nuevo = Number(form.cantidadUsada || 0);
          const diferencia = nuevo - anterior;

          // ✅ Si aumentó → descontar más stock
          if (diferencia > 0) {
            await decrementarStockMedicamento(form.itemInventarioId, diferencia);
          }

          // ✅ Si disminuyó → devolver stock
          if (diferencia < 0) {
            await restaurarStockMedicamento(
              form.itemInventarioId,
              Math.abs(diferencia)
            );
          }
        }

      } else {
        await agregarCosto(animalSel.id, costoData);

        // Opcional: actualizar stock si es Medicamento
        if (form.tipo === "Medicamentos" && form.itemInventarioId) {
          try{
          await decrementarStockMedicamento(form.itemInventarioId, Number(form.cantidadUsada));
            } catch(e) {
            console.error("Error al decrementar stock:", e.message);
            setError("No se pudo actualizar el stock: " + e.message);
            }
        }
      }

      const actualizados = await getCostosAnimal(animalSel.id);
      setCostos(actualizados.sort((a, b) => (b.fecha > a.fecha ? 1 : -1)));
      setForm(FORM_VACIO);
      setEditandoId(null);
    } catch (e) {
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  
  } catch (e) {
    console.error("Error al guardar costo:", e);
    setError("Error al guardar. Intenta de nuevo.");
  } finally {
    setGuardando(false);
    }
  }

  const handleEditar = (costo) => {
    setForm({
      tipo: costo.tipo,
      monto: costo.monto,
      fecha: costo.fecha,
      descripcion: costo.descripcion || "",
      itemInventarioId: costo.itemInventarioId || "",
      cantidadUsada: costo.cantidadUsada || "",
    });
    setCostoOriginal(costo);
    setEditandoId(costo.id);
  };

  const handleEliminar = async (costo) => {

    console.log("Tipo:", costo.tipo);
    console.log("ID Medicamento:", costo.itemInventarioId);
    console.log("Cantidad:", costo.cantidadUsada);

    if (!window.confirm("¿Eliminar este costo?")) return;

    try {
      console.log("ELIMINANDO:", costo);

      // Restaurar stock si es medicamento
      if (costo.tipo === "Medicamentos" && costo.itemInventarioId && costo.cantidadUsada) {
        console.log("🔄 Restaurando stock...");
        await restaurarStockMedicamento(costo.itemInventarioId, Number(costo.cantidadUsada));

        // Actualizar estado local para reflejar cambio inmediatamente
        setMedicamentos((prev) =>
          prev.map((m) =>
            m.id === costo.itemInventarioId
              ? { ...m, cantidad: (m.cantidad || 0) + Number(costo.cantidadUsada) }
              : m
          )
        );
        console.log("✅ Stock restaurado correctamente");
      }

      // Eliminar el costo de Firebase
      await eliminarCosto(animalSel.id, costo.id);

      // Refrescar lista de costos
      const actualizados = await getCostosAnimal(animalSel.id);
      setCostos(actualizados.sort((a, b) => (b.fecha > a.fecha ? 1 : -1)));

    } catch (err) {
      console.error("ERROR AL ELIMINAR:", err);
      setError("No se pudo eliminar el costo. Intenta de nuevo.");
    }
  };

  const cancelarEdicion = () => {
    setForm(FORM_VACIO);
    setEditandoId(null);
    setError("");
  };

  const colorTipo = {
    "Alimentación": { bg: "#fef9c3", color: "#854d0e" },
    "Veterinario/Vacunas": { bg: "#dbeafe", color: "#1e40af" },
    "Medicamentos": { bg: "#fce7f3", color: "#9d174d" },
  };

  return (
    <div style={{ color: "#f1f5f9", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px", color: "#fff" }}>
        💰 Registro de Costos
      </h1>


      {/* Selector de animal */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: "14px",
          padding: "20px 24px",
          marginBottom: "24px",
          border: "1px solid #334155",
        }}
      >
        <p style={{ fontSize: "13px", fontWeight: 700, color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Seleccionar animal
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {animales.map((a) => (
            <button
              key={a.id}
              onClick={() => { setAnimalSel(a); setForm(FORM_VACIO); setEditandoId(null); setError(""); }}
              style={{
                padding: "8px 18px",
                borderRadius: "999px",
                border: animalSel?.id === a.id ? "2px solid #22c55e" : "1.5px solid #475569",
                background: animalSel?.id === a.id ? "#166534" : "#0f172a",
                color: animalSel?.id === a.id ? "#86efac" : "#94a3b8",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {a.id} · {a.raza}
            </button>
          ))}
        </div>
      </div>

      {animalSel && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px", alignItems: "start" }}>

          {/* Formulario */}
          <div
            style={{
              background: "#1e293b",
              borderRadius: "14px",
              padding: "24px",
              border: "1px solid #334155",
            }}
          >
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "18px" }}>
              {editandoId ? "✏️ Editar costo" : "➕ Nuevo costo"} — {animalSel.id}
            </p>

            {/* Tipo */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Tipo de costo</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {TIPOS_COSTO.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      border: form.tipo === t ? "2px solid #22c55e" : "1.5px solid #475569",
                      background: form.tipo === t ? "#166534" : "#0f172a",
                      color: form.tipo === t ? "#86efac" : "#94a3b8",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Selección de medicamento si el tipo es Medicamentos */}
            {form.tipo === "Medicamentos" && (
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Medicamento</label>
                <select
                  value={form.itemInventarioId || ""}
                  onChange={(e) =>
                  {
                    const id = e.target.value;

                    const medicamentoSeleccionado = medicamentos.find(m => m.id === id);
                  
                    setForm((f) => ({ ...f, itemInventarioId: id, monto: medicamentoSeleccionado?.costoUnitario || "" }))
                  }}
                  style={inputStyle}
                >
                  <option value="">Selecciona un medicamento</option>
                  {medicamentos.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.nombre} (Stock: {m.cantidad ?? 0})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cantidad usada */}
            {form.tipo === "Medicamentos" && (
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Cantidad usada</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej: 2"
                  value={form.cantidadUsada || ""}
                  onChange={(e) => setForm((f) => ({ ...f, cantidadUsada: Number(e.target.value) }))}
                  style={inputStyle}
                />
              </div>
            )}

            {/* Monto */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Monto (COP)</label>
              <input
                type="number"
                value={form.monto}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monto: e.target.value }))
                }
                disabled={form.tipo === "Medicamentos"} // ✅ correcto
                style={{
                  ...inputStyle,
                  opacity: form.tipo === "Medicamentos" ? 0.6 : 1,
                }}
              />
            </div>

            {/* Fecha */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                style={inputStyle}
              />
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Descripción (opcional)</label>
              <textarea
                placeholder="Ej: Vacuna triple bovina"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                rows={2}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            {error && (
              <p style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>⚠️ {error}</p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleSubmit}
                disabled={guardando}
                style={{
                  flex: 1,
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  opacity: guardando ? 0.6 : 1,
                }}
              >
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Registrar costo"}
              </button>
              {editandoId && (
                <button
                  onClick={cancelarEdicion}
                  style={{
                    padding: "10px 16px",
                    background: "#334155",
                    color: "#94a3b8",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {/* FILTROS */}
          <div
            style={{
              background: "#1e293b",
              borderRadius: "14px",
              padding: "16px 24px",
              border: "1px solid #334155",
            }}
          >
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #334155", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: 0 }}>
                Filtros
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>


                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <p style={{ fontSize: "12px", fontWeight: 200, color: "#fff", margin: 8 }}>
                    Tipos:
                  </p>
                  <select
                    value={filtros.tipo}
                    onChange={(e) => setFiltros(f => ({ ...f, tipo: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Todos los tipos</option>
                    {TIPOS_COSTO.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <p style={{ fontSize: "12px", fontWeight: 200, color: "#fff", margin: 8 }}>
                    Fecha Desde:
                  </p>

                  <input
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) => setFiltros(f => ({ ...f, fechaInicio: e.target.value }))}
                    style={inputStyle}
                  />

                  <p style={{ fontSize: "12px", fontWeight: 200, color: "#fff", margin: 8 }}>
                    Fecha Hasta:
                  </p>

                  <input
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) => setFiltros(f => ({ ...f, fechaFin: e.target.value }))}
                    style={inputStyle}
                  />

                </div>
              </div>
            </div>

            {/* Lista de costos */}
            <div
              style={{
                background: "#1e293b",
                borderRadius: "14px",
                border: "1px solid #334155",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: 0 }}>
                  Costos de {animalSel.id} · {animalSel.raza}
                </p>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>
                  Total: {fmt(totalCostos)}
                </span>
              </div>

              <div style={{ padding: "16px 24px", borderBottom: "1px solid #334155" }}>

                <div style={{ marginBottom: "10px" }}>
                  <button onClick={() => setTipoAcumulado("mensual")} style={tipoAcumulado === "mensual" ? btnFiltroActivo : btnFiltro}>
                    Mensual
                  </button>
                  <button onClick={() => setTipoAcumulado("anual")} style={tipoAcumulado === "anual" ? btnFiltroActivo : btnFiltro}>
                    Anual
                  </button>
                </div>
              </div>

              <div style={acumuladosContainer}>
                {Object.entries(acumulados).length === 0 && (
                  <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center" }}>
                    No hay datos para mostrar
                  </p>
                )}

                {Object.entries(acumulados).map(([periodo, total]) => {
                  // periodo tiene formato "2026-3" o "2026" si es anual
                  if (tipoAcumulado === "mensual") {
                    const [year, monthNum] = periodo.split("-");
                    const mesNombre = meses[Number(monthNum) - 1] || "Mes inválido";
                    return (
                      <p key={periodo} style={acumuladoItem}>
                        {mesNombre} {year}: {fmt(total)}
                      </p>
                    );
                  } else {
                    // Anual
                    return (
                      <p key={periodo} style={acumuladoItem}>
                        {periodo}: {fmt(total)}
                      </p>
                    );
                  }
                })}
              </div>
            </div>

            {loadingCostos ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                Cargando costos...
              </div>
            ) : costos.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                <p style={{ fontSize: "32px", marginBottom: "8px" }}>📭</p>
                Sin costos registrados aún.
              </div>
            ) : (
              <div>
                {costosFiltrados.map((c) => {
                  const tc = colorTipo[c.tipo] || { bg: "#334155", color: "#94a3b8" };
                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: "16px 24px",
                        borderBottom: "1px solid #1e293b",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        background: "#0f172a",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{
                            background: tc.bg,
                            color: tc.color,
                            borderRadius: "999px",
                            padding: "2px 10px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}>
                            {c.tipo}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{c.fecha}</span>
                        </div>
                        <p style={{ fontSize: "18px", fontWeight: 800, color: "#22c55e", margin: "2px 0" }}>
                          {fmt(c.monto)}
                        </p>
                        {c.descripcion && (
                          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>{c.descripcion}</p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEditar(c)}
                          style={btnSecundario}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(c)}
                          style={btnEliminar}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 700,
  color: "#94a3b8",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const inputStyle = {
  width: "100%",
  background: "#0f172a",
  border: "1.5px solid #334155",
  borderRadius: "8px",
  padding: "10px 12px",
  color: "#f1f5f9",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
};

const btnSecundario = {
  padding: "8px 18px",
  borderRadius: "999px",
  border: "2px solid #22c55e",
  background: "#166534",
  color: "#86efac",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
};

const btnFiltro = {
  padding: "6px 14px",
  borderRadius: "999px",
  border: "1.5px solid #475569",
  background: "#1e293b",
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.3s ease",
};

const btnFiltroActivo = {
  ...btnFiltro,
  border: "2px solid #22c55e",
  background: "#166534",
  color: "#86efac",
  fontWeight: 700,
  fontSize: "13px",
  boxShadow: "0 0 8px #22c55e",
};

const acumuladosContainer = {
  background: "#0f172a",
  borderRadius: "12px",
  padding: "12px 16px",
  marginTop: "10px",
  maxHeight: "150px",
  overflowY: "auto",
};

const acumuladoItem = {
  fontSize: "16px",
  color: "#22c55e",  // Verde luminoso
  fontWeight: "700",
  marginBottom: "8px",
};

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const btnEliminar = {
  padding: "6px 12px",
  background: "#450a0a",
  border: "1.5px solid #7f1d1d",
  borderRadius: "6px",
  color: "#fca5a5",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};
