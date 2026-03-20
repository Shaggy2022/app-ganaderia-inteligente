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

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

const hoy = () => new Date().toISOString().split("T")[0];

const FORM_VACIO = { tipo: TIPOS_COSTO[0], monto: "", fecha: hoy(), descripcion: "" };

export default function Costs() {
  const [animales, setAnimales]         = useState([]);
  const [animalSel, setAnimalSel]       = useState(null);
  const [costos, setCostos]             = useState([]);
  const [loadingCostos, setLoadingCostos] = useState(false);
  const [form, setForm]                 = useState(FORM_VACIO);
  const [editandoId, setEditandoId]     = useState(null);
  const [guardando, setGuardando]       = useState(false);
  const [error, setError]               = useState("");

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

  const totalCostos = costos.reduce((acc, c) => acc + Number(c.monto), 0);

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
    setGuardando(true);
    try {
      if (editandoId) {
        await editarCosto(animalSel.id, editandoId, form);
      } else {
        await agregarCosto(animalSel.id, form);
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
  };

  const handleEditar = (costo) => {
    setForm({
      tipo: costo.tipo,
      monto: costo.monto,
      fecha: costo.fecha,
      descripcion: costo.descripcion || "",
    });
    setEditandoId(costo.id);
  };

  const handleEliminar = async (costoId) => {
    if (!window.confirm("¿Eliminar este costo?")) return;
    await eliminarCosto(animalSel.id, costoId);
    setCostos((prev) => prev.filter((c) => c.id !== costoId));
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

            {/* Monto */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Monto (COP)</label>
              <input
                type="number"
                placeholder="Ej: 150000"
                value={form.monto}
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                style={inputStyle}
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
                {costos.map((c) => {
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
                          onClick={() => handleEliminar(c.id)}
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
  padding: "6px 12px",
  background: "#1e293b",
  border: "1.5px solid #475569",
  borderRadius: "6px",
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

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
