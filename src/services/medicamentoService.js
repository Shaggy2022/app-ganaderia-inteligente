import { db } from "../firebase/firebaseConfig";
import { getDocs } from "firebase/firestore";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc
} from "firebase/firestore";

const collectionName = "medicamentos";

export async function obtenerMedicamentos() {
  const medicamentosCol = collection(db, "medicamentos");
  const snapshot = await getDocs(medicamentosCol);

  // Devuelve un array con id y datos de cada medicamento
  return snapshot.docs.map(doc => ({
    id: doc.id,      // Este es el ID Firestore
    ...doc.data()    // Los demás datos
  }));
}

export async function decrementarStockMedicamento(id, cantidadUsada) {
  const ref = doc(db, "medicamentos", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Medicamento no encontrado");

  const stockActual = snap.data().cantidad || 0;
  const nuevoStock = stockActual - cantidadUsada;

  if (nuevoStock < 0) throw new Error("No hay suficiente stock");

  await updateDoc(ref, { cantidad: nuevoStock, costoTotal: nuevoStock * (snap.data().costoUnitario || 0) });
};

export const restaurarStockMedicamento = async (id, cantidadUsada) => {
  const ref = doc(db, "medicamentos", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Medicamento no encontrado");

  const stockActual = snap.data().cantidad || 0;
  const nuevoStock = stockActual + cantidadUsada;

  if (nuevoStock < 0) throw new Error("No hay suficiente stock");

  await updateDoc(ref, { cantidad: nuevoStock });
};

export const addMedicamento = async (data) => {
  return await addDoc(collection(db, collectionName), data);
};

export const updateMedicamento = async (id, data) => {
  const ref = doc(db, collectionName, id);
  return await updateDoc(ref, data);
};

export const deleteMedicamento = async (id) => {
  const ref = doc(db, collectionName, id);
  return await deleteDoc(ref);
};

export const obtenerMedicamentosMasUsados = (medicamentos) => {
  const conteo = {};

  medicamentos.forEach((med) => {
    const nombre = med.nombre || "Sin nombre";

    if (!conteo[nombre]) {
      conteo[nombre] = 0;
    }

    conteo[nombre] += Number(med.cantidad) || 0;
  });

  return Object.entries(conteo)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // Top 5
};