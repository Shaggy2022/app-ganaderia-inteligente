import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

export const crearEspecie = async (nombre) => {
  if (!nombre.trim()) throw new Error("Nombre requerido");

  const snapshot = await getDocs(collection(db, "especies"));

  const existe = snapshot.docs.some(
    (doc) => doc.data().nombre.toLowerCase() === nombre.toLowerCase()
  );

  if (existe) throw new Error("La especie ya existe");

  await addDoc(collection(db, "especies"), {
    nombre: nombre.trim(),
  });
};

export const obtenerEspecies = async () => {
  const snapshot = await getDocs(collection(db, "especies"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};