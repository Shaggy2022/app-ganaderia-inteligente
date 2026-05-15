import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export const registrarAnimal = async (animal, isEdit = false) => {
  try {
    const idTrim = animal.id.trim();

    if (!idTrim) throw new Error("El ID no puede estar vacío");
    if (!animal.especie) throw new Error("Debe seleccionar una especie");
    if (!animal.categoria) throw new Error("Debe seleccionar una categoría");

    const docRef = doc(db, "animales", idTrim);

    // SOLO validar duplicado si es creación
    if (!isEdit) {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        throw new Error("El ID ya existe");
      }
    }

    await setDoc(docRef, {
      id: idTrim,
      raza: animal.raza,
      especie: animal.especie,
      categoria: animal.categoria,
      fechaNacimiento: animal.fechaNacimiento,
      pesoInicial: Number(animal.pesoInicial || 0),
      precioVenta: Number(animal.precioVenta || 0),
      vaccines: animal.vaccines || [],
    });

    console.log("Animal guardado en Firebase!", animal);
  } catch (error) {
    console.error("Error registrando animal:", error);
    throw error;
  }
};