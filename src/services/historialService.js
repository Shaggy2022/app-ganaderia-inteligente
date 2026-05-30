import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export async function getHistorialByAnimal(animalId) {
  try {
    const historial = [];

    // ✅ MEDICAMENTOS
    const medsSnap = await getDocs(collection(db, "medicamentos"));
    medsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.animalId?.toUpperCase() === animalId?.toUpperCase()) {
        historial.push({
          id: doc.id,
          fecha: data.fechaUso,
          descripcion: data.nombre,
          tipo: "medicamento",
          costo: Number(data.costoTotal) || 0,
        });
      }
    });

    // ✅ EVENTOS VETERINARIOS 🔥
    const eventosSnap = await getDocs(collection(db, "eventosVeterinarios"));
    eventosSnap.forEach((doc) => {
      const data = doc.data();

      if (data.animalId?.toUpperCase() === animalId?.toUpperCase()) {
        historial.push({
          id: doc.id,
          fecha: data.fechaProgramada,
          descripcion: data.tipoServicio || "Visita veterinaria",
          tipo: "veterinario",
          estado: data.estado // 👈 importante para visitas
        });
      }
    });

    // ✅ SERVICIOS VETERINARIOS (CON COSTO)
    const serviciosSnap = await getDocs(collection(db, "serviciosVeterinarios"));

    serviciosSnap.forEach((doc) => {
      const data = doc.data();

      if (data.animalId?.toUpperCase() === animalId?.toUpperCase()) {
        historial.push({
          id: doc.id,
          fecha: data.fecha,
          descripcion: data.descripcion || data.tipoServicio || "Servicio veterinario",
          tipo: "servicioVeterinario",

          // 🔥 ESTE ES EL COSTO QUE FALTABA
          costo: Number(data.costoTotal || data.costo || 0)
        });
      }
    });

    // ✅ ALIMENTACIÓN
    const alimentosSnap = await getDocs(collection(db, "alimentacion"));

    alimentosSnap.forEach((doc) => {
      const data = doc.data();

      if (data.animalId?.toUpperCase() === animalId?.toUpperCase()) {
        historial.push({
          id: doc.id,
          fecha: data.fecha,
          descripcion: `Alimentación: ${data.tipo || "Consumo"}`,
          tipo: "alimento",

          // 🔥 ESTE ES EL QUE SUMA
          costo: Number(data.total || 0)
        });
      }
    });

    return historial;

  } catch (error) {
    console.error("Error historial:", error);
    return [];
  }
}