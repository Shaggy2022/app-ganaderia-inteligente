// src/services/animalService.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const registrarAnimal = async (animal) => {
  try {
    // Quitamos espacios del ID y lo usamos como documento
    const idTrim = animal.id.trim();

    if (!idTrim) throw new Error("El ID no puede estar vacío");

    const docRef = doc(db, "animales", idTrim);

    // Revisamos si ya existe
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      throw new Error(`El ID "${idTrim}" ya existe`);
    }

    // Guardamos el documento
    await setDoc(docRef, {
      id: idTrim,
      raza: animal.raza,
      fechaNacimiento: animal.fechaNacimiento,
      pesoInicial: Number(animal.pesoInicial)
    });

    console.log("Animal guardado en Firebase!", animal);
  } catch (error) {
    console.error("Error registrando animal:", error);
    throw error;
  }
};