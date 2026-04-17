// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import StatCard from "../components/StatCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [animales, setAnimales] = useState([]);

  useEffect(() => {
    const fetchAnimales = async () => {
      try {
        const snapshot = await getDocs(collection(db, "animales"));
        const docs = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const animal = { id: doc.id, ...doc.data() };

            // Traer sub-collection costos
            const costosSnap = await getDocs(collection(db, "animales", doc.id, "costos"));
            animal.costos = costosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

            // Traer sub-collection medicamentos
            const medsSnap = await getDocs(collection(db, "animales", doc.id, "medicamentos"));
            animal.medicamentos = medsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

            return animal;
          })
        );
        setAnimales(docs);
      } catch (err) {
        console.error("Error cargando animales:", err);
      }
    };

    fetchAnimales();
  }, []);

  // KPIs
  const totalAnimales = animales.length;

  const pesoPromedio =
    animales.length > 0
      ? (animales.reduce((acc, a) => acc + (a.pesoInicial || 0), 0) / animales.length).toFixed(1)
      : 0;

  const totalCostos = animales.reduce((acc, a) => {
    const costos = (a.costos || []).reduce((s, c) => s + (c.monto || 0), 0);
    const meds = (a.medicamentos || []).reduce((s, m) => s + (m.monto || 0), 0);
    return acc + costos + meds;
  }, 0);

  const consumoAlimento = animales.reduce((acc, a) => acc + ((a.pesoInicial || 0) * 0.02), 0).toFixed(1);

  const data = animales.map((a, i) => {
    const costos = (a.costos || []).reduce((s, c) => s + (c.monto || 0), 0);
    const meds = (a.medicamentos || []).reduce((s, m) => s + (m.monto || 0), 0);
    return {
      name: a.raza || `Animal ${i + 1}`,
      Peso: a.pesoInicial || 0,
      Costo: costos + meds
    };
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard title="Animales" value={totalAnimales} color="green" />
        <StatCard title="Peso Promedio" value={`${pesoPromedio}kg`} color="blue" />
        <StatCard title="Costo Total" value={`$${totalCostos}`} color="pink" />
        <StatCard title="Consumo Alimento" value={`${consumoAlimento}kg`} color="yellow" />
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-4">Peso vs Costo por Animal</h2>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Line type="monotone" dataKey="Peso" stroke="#6EE7B7" strokeWidth={3} />
              <Line type="monotone" dataKey="Costo" stroke="#F472B6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-300 text-center py-12">No hay datos de animales para mostrar.</p>
        )}
      </div>
    </div>
  );
}