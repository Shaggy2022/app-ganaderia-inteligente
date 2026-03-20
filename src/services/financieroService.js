// src/services/financieroService.js
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

/**
 * Obtiene todos los costos de un animal específico desde HU8 (subcolección costos)
 * y retorna la suma total invertida.
 */
export async function getCostosAnimal(animalId) {
  try {
    const costosRef = collection(db, "animales", animalId, "costos");
    const snapshot = await getDocs(costosRef);
    let total = 0;
    const costos = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const monto = Number(data.monto) || 0;
      total += monto;
      costos.push({ id: doc.id, ...data });
    });
    return { total, costos };
  } catch (error) {
    console.error(`Error obteniendo costos del animal ${animalId}:`, error);
    return { total: 0, costos: [] };
  }
}

/**
 * Obtiene todos los animales con sus datos base, costos totales y calcula utilidad.
 * Filtra por lote y/o periodo si se especifican.
 */
export async function getReporteFinanciero({ lote, periodo } = {}) {
  try {
    let animalesQuery = collection(db, "animales");

    // Filtro por lote si se especifica
    if (lote && lote !== "todos") {
      animalesQuery = query(
        collection(db, "animales"),
        where("lote", "==", lote)
      );
    }

    const animalesSnap = await getDocs(animalesQuery);
    const animales = [];

    for (const docAnimal of animalesSnap.docs) {
      const animalData = { id: docAnimal.id, ...docAnimal.data() };

      // Obtener costos desde subcolección (HU8)
      const { total: totalCostos, costos } = await getCostosAnimal(docAnimal.id);

      // Precio de venta (estimado o real)
      const precioVenta = Number(animalData.precioVenta) || 0;

      // Utilidad = venta - inversión
      const utilidad = precioVenta - totalCostos;
      const rentabilidad =
        totalCostos > 0
          ? ((utilidad / totalCostos) * 100).toFixed(1)
          : "0.0";

      // Filtro por periodo (fecha de nacimiento o ingreso)
      if (periodo && periodo !== "todos") {
        const fechaAnimal =
          animalData.fechaNacimiento || animalData.fechaIngreso || "";
        if (!fechaAnimal.startsWith(periodo)) continue;
      }

      animales.push({
        ...animalData,
        totalCostos,
        costos,
        precioVenta,
        utilidad,
        rentabilidad: Number(rentabilidad),
      });
    }

    // Totales generales
    const capitalTotal = animales.reduce((acc, a) => acc + a.totalCostos, 0);
    const ventaTotal = animales.reduce((acc, a) => acc + a.precioVenta, 0);
    const utilidadTotal = ventaTotal - capitalTotal;
    const rentabilidadTotal =
      capitalTotal > 0
        ? ((utilidadTotal / capitalTotal) * 100).toFixed(1)
        : "0.0";

    return {
      animales,
      resumen: {
        totalAnimales: animales.length,
        capitalTotal,
        ventaTotal,
        utilidadTotal,
        rentabilidadTotal: Number(rentabilidadTotal),
      },
    };
  } catch (error) {
    console.error("Error generando reporte financiero:", error);
    throw error;
  }
}

/**
 * Obtiene los lotes únicos registrados en la colección animales.
 */
export async function getLotesDisponibles() {
  try {
    const snap = await getDocs(collection(db, "animales"));
    const lotes = new Set();
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.lote) lotes.add(data.lote);
    });
    return Array.from(lotes).sort();
  } catch (error) {
    console.error("Error obteniendo lotes:", error);
    return [];
  }
}

/**
 * Obtiene los años disponibles según fechaNacimiento o fechaIngreso.
 */
export async function getPeriodosDisponibles() {
  try {
    const snap = await getDocs(collection(db, "animales"));
    const years = new Set();
    snap.forEach((doc) => {
      const data = doc.data();
      const fecha = data.fechaNacimiento || data.fechaIngreso || "";
      if (fecha.length >= 4) years.add(fecha.substring(0, 4));
    });
    return Array.from(years).sort().reverse();
  } catch (error) {
    console.error("Error obteniendo periodos:", error);
    return [];
  }
}
