// src/services/eventosVetService.js

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const hoy = () => new Date().toISOString().split("T")[0];

export function calcularEstado(fechaProgramada, estadoActual) {
  if (estadoActual === "completado") return "completado";

  const hoyDate = new Date();
  hoyDate.setHours(0, 0, 0, 0);

  const eventoDate = new Date(fechaProgramada + "T00:00:00");
  const diffMs = eventoDate - hoyDate;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return "vencido";
  if (diffDias <= 3) return "proximo";
  return "pendiente";
}

// ─────────────────────────────────────────────────────────────
// NORMALIZADOR → CLAVE PARA HU2
// Convierte eventos veterinarios en eventos del historial
// ─────────────────────────────────────────────────────────────

function normalizarEventoVet(evento) {
  return {
    id: evento.id,
    animalId: evento.animalId,
    fecha: evento.fechaProgramada,
    descripcion: `${evento.tipoServicio} (${evento.estado})`,
    tipo: "sanitario",

    // Estos campos permiten integrarlo con rentabilidad
    costo: 0, // luego puedes conectar medicamentos
    produccion: 0,

    // datos extras
    veterinario: evento.veterinario,
    notas: evento.notas,
  };
}

// ─────────────────────────────────────────────────────────────
// CONSULTAS
// ─────────────────────────────────────────────────────────────

export async function getEventosVet() {
  const q = query(
    collection(db, "eventosVeterinarios"),
    orderBy("fechaProgramada", "asc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = { id: d.id, ...d.data() };
    return {
      ...data,
      estado: calcularEstado(data.fechaProgramada, data.estado),
    };
  });
}

/**
 * 🔥 NUEVO → traer eventos por animal (para HU2)
 */
export async function getEventosVetByAnimal(animalId) {
  const q = query(
    collection(db, "eventosVeterinarios"),
    where("animalId", "==", animalId),
    orderBy("fechaProgramada", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = { id: d.id, ...d.data() };

    const eventoConEstado = {
      ...data,
      estado: calcularEstado(data.fechaProgramada, data.estado),
    };

    // ✅ lo devolvemos ya listo para HISTORIAL
    return normalizarEventoVet(eventoConEstado);
  });
}

// ─────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────

export async function addEventoVet(datos) {
  const estado = calcularEstado(datos.fechaProgramada, "pendiente");

  return addDoc(collection(db, "eventosVeterinarios"), {
    animalId: datos.animalId || "",
    animalNombre: datos.animalNombre || "",
    lote: datos.lote || "",
    tipoServicio: datos.tipoServicio || "Consulta veterinaria",
    fechaProgramada: datos.fechaProgramada || hoy(),
    veterinario: datos.veterinario || "",
    notas: datos.notas || "",
    estado,
    creadoEn: serverTimestamp(),
  });
}

export async function completarEventoVet(eventoId) {
  const ref = doc(db, "eventosVeterinarios", eventoId);
  return updateDoc(ref, { estado: "completado" });
}

export async function deleteEventoVet(eventoId) {
  return deleteDoc(doc(db, "eventosVeterinarios", eventoId));
}

// ─────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────

export function clasificarEventos(eventos) {
  return eventos.reduce(
    (acc, e) => {
      acc[e.estado === "proximo" ? "proximos" : e.estado + "s"]?.push(e);
      return acc;
    },
    { vencidos: [], proximos: [], pendientes: [], completados: [] }
  );
}