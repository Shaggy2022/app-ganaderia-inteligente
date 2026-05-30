import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const TIPOS_COSTO = ["Alimentación", "Vacunas", "Medicamentos"];

// ─────────────────────────────────────────────────────────────
// NORMALIZADOR → CLAVE PARA HISTORIAL (HU2)
// ─────────────────────────────────────────────────────────────

function normalizarCosto(costo, animalId) {
  return {
    id: costo.id,
    animalId: animalId,
    fecha: costo.fecha,
    descripcion: `${costo.tipo} - ${costo.descripcion || "Costo registrado"}`,
    tipo: "costo",

    // Para rentabilidad
    costo: Number(costo.monto) || 0,
    produccion: 0,
  };
}

// ─────────────────────────────────────────────────────────────
// CRUD ORIGINAL
// ─────────────────────────────────────────────────────────────

// Obtener todos los costos de un animal
export async function getCostosAnimal(animalId) {
  const ref = collection(db, "animales", animalId, "costos");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Agregar un costo a un animal
export async function agregarCosto(animalId, costo) {
  const ref = collection(db, "animales", animalId, "costos");

  await addDoc(ref, {
    tipo: costo.tipo,
    monto: Number(costo.monto),
    fecha: costo.fecha,
    descripcion: costo.descripcion || "",
    creadoEn: serverTimestamp(),
  });
}

// Eliminar un costo
export async function eliminarCosto(animalId, costoId) {
  const ref = doc(db, "animales", animalId, "costos", costoId);
  await deleteDoc(ref);
}

// Editar un costo
export async function editarCosto(animalId, costoId, datos) {
  const ref = doc(db, "animales", animalId, "costos", costoId);

  await updateDoc(ref, {
    tipo: datos.tipo,
    monto: Number(datos.monto),
    fecha: datos.fecha,
    descripcion: datos.descripcion || "",
  });
}

// ─────────────────────────────────────────────────────────────
// 🔥 NUEVO → COSTOS COMO HISTORIAL
// ─────────────────────────────────────────────────────────────

export async function getCostosHistorialByAnimal(animalId) {
  const costos = await getCostosAnimal(animalId);

  // Convertimos a formato historial
  return costos.map((costo) => normalizarCosto(costo, animalId));
}