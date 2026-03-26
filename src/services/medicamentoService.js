import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";

const collectionName = "medicamentos";

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