import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

export const crearCategoria = async (nombre) => {
  if (!nombre.trim()) throw new Error("Nombre requerido");

  const snapshot = await getDocs(collection(db, "categorias"));

  const existe = snapshot.docs.some(
    (doc) => doc.data().nombre.toLowerCase() === nombre.toLowerCase()
  );

  if (existe) throw new Error("La categoría ya existe");

  await addDoc(collection(db, "categorias"), {
    nombre: nombre.trim(),
  });
};

export const obtenerCategorias = async () => {
  const snapshot = await getDocs(collection(db, "categorias"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};