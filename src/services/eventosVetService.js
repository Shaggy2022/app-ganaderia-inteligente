// src/services/eventosVetService.js
// Servicio para gestionar eventos veterinarios programados (HU10)

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// ─────────────────────────────────────────────────────────────
// ESTRUCTURA EN FIRESTORE
//
// /eventosVeterinarios/{id}
//   animalId:        string   ("A001")
//   animalNombre:    string   ("Vaca")
//   lote:            string   ("Lote A")
//   tipoServicio:    string   ("Vacunación")
//   fechaProgramada: string   ("2025-05-20")  ← YYYY-MM-DD
//   veterinario:     string   ("Dr. Ramírez")
//   notas:           string
//   estado:          string   ("pendiente" | "completado" | "vencido")
//   creadoEn:        timestamp
// ─────────────────────────────────────────────────────────────

// ── Helpers de fecha ─────────────────────────────────────────

const hoy = () => new Date().toISOString().split("T")[0];

/**
 * Calcula el estado de un evento según su fechaProgramada.
 * - "vencido"   → fecha pasada y no completado
 * - "proximo"   → entre hoy y hoy+3 días
 * - "pendiente" → más de 3 días en el futuro
 * - "completado"→ ya marcado como completado (no se recalcula)
 */
export function calcularEstado(fechaProgramada, estadoActual) {
  if (estadoActual === "completado") return "completado";

  const hoyDate   = new Date();
  hoyDate.setHours(0, 0, 0, 0);

  const eventoDate = new Date(fechaProgramada + "T00:00:00");
  const diffMs     = eventoDate - hoyDate;
  const diffDias   = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0)  return "vencido";
  if (diffDias <= 3) return "proximo";
  return "pendiente";
}

// ── CRUD ─────────────────────────────────────────────────────

/**
 * Trae todos los eventos ordenados por fechaProgramada ascendente.
 * Recalcula el estado de cada uno al cargar.
 */
export async function getEventosVet() {
  const q    = query(collection(db, "eventosVeterinarios"), orderBy("fechaProgramada", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = { id: d.id, ...d.data() };
    return { ...data, estado: calcularEstado(data.fechaProgramada, data.estado) };
  });
}

/**
 * Agrega un nuevo evento programado.
 * El estado inicial se calcula automáticamente.
 */
export async function addEventoVet(datos) {
  const estado = calcularEstado(datos.fechaProgramada, "pendiente");
  return addDoc(collection(db, "eventosVeterinarios"), {
    animalId:        datos.animalId        || "",
    animalNombre:    datos.animalNombre    || "",
    lote:            datos.lote            || "",
    tipoServicio:    datos.tipoServicio    || "Consulta veterinaria",
    fechaProgramada: datos.fechaProgramada || hoy(),
    veterinario:     datos.veterinario     || "",
    notas:           datos.notas           || "",
    estado,
    creadoEn: serverTimestamp(),
  });
}

/**
 * Marca un evento como completado.
 */
export async function completarEventoVet(eventoId) {
  const ref = doc(db, "eventosVeterinarios", eventoId);
  return updateDoc(ref, { estado: "completado" });
}

/**
 * Elimina un evento programado.
 */
export async function deleteEventoVet(eventoId) {
  return deleteDoc(doc(db, "eventosVeterinarios", eventoId));
}

/**
 * Retorna los eventos separados por categoría para el banner de alertas.
 * { vencidos: [], proximos: [], pendientes: [], completados: [] }
 */
export function clasificarEventos(eventos) {
  return eventos.reduce(
    (acc, e) => {
      acc[e.estado === "proximo" ? "proximos" : e.estado + "s"]?.push(e);
      return acc;
    },
    { vencidos: [], proximos: [], pendientes: [], completados: [] }
  );
}
