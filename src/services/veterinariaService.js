// src/services/veterinariaService.js
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export const TIPOS_SERVICIO = [
  "Consulta veterinaria",
  "Vacunación",
  "Desparasitación",
  "Cirugía",
  "Otro tratamiento",
];

// Crea el costo en la subcolección del animal
const crearCostoAnimal = async (animalId, servicio) => {
  const ref = collection(db, "animales", animalId, "costos");
  const costoDoc = await addDoc(ref, {
    tipo: "Veterinario/Vacunas",
    monto: servicio.costoTotal,
    fecha: servicio.fecha,
    descripcion: `${servicio.tipoServicio}: ${servicio.descripcion || ""}`.trim(),
  });
  return costoDoc.id;
};

// Actualiza el costo vinculado en la subcolección del animal
const actualizarCostoAnimal = async (animalId, costoId, servicio) => {
  const ref = doc(db, "animales", animalId, "costos", costoId);
  await updateDoc(ref, {
    tipo: "Veterinario/Vacunas",
    monto: servicio.costoTotal,
    fecha: servicio.fecha,
    descripcion: `${servicio.tipoServicio}: ${servicio.descripcion || ""}`.trim(),
  });
};

// Elimina el costo vinculado en la subcolección del animal
const eliminarCostoAnimal = async (animalId, costoId) => {
  const ref = doc(db, "animales", animalId, "costos", costoId);
  await deleteDoc(ref);
};

// Registra un servicio veterinario y crea su costo en el animal
export const addServicioVet = async (data) => {
  const costoId = await crearCostoAnimal(data.animalId, data);
  return await addDoc(collection(db, "serviciosVeterinarios"), {
    ...data,
    costoId,
    creadoEn: new Date().toISOString(),
  });
};

// Actualiza un servicio y sincroniza su costo en el animal
export const updateServicioVet = async (id, data, costoIdAnterior) => {
  const ref = doc(db, "serviciosVeterinarios", id);
  if (costoIdAnterior && data.animalId) {
    await actualizarCostoAnimal(data.animalId, costoIdAnterior, data);
    await updateDoc(ref, { ...data, costoId: costoIdAnterior });
  } else if (data.animalId) {
    const costoId = await crearCostoAnimal(data.animalId, data);
    await updateDoc(ref, { ...data, costoId });
  } else {
    await updateDoc(ref, data);
  }
};

// Elimina un servicio y su costo vinculado en el animal
export const deleteServicioVet = async (id, animalId, costoId) => {
  if (animalId && costoId) {
    await eliminarCostoAnimal(animalId, costoId);
  }
  await deleteDoc(doc(db, "serviciosVeterinarios", id));
};
