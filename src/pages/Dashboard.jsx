import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import StatCard from "../components/StatCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [animales, setAnimales] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "animales"), snapshot => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnimales(docs);
    });
    return () => unsub();
  }, []);

  const totalAnimales = animales.length;

  // Peso promedio usando pesoInicial
  const pesoPromedio = animales.length
    ? (animales.reduce((acc, a) => acc + (a.pesoInicial || 0), 0) / animales.length).toFixed(1)
    : 0;

  // Consumo de alimento estimado como 2% del peso
  const consumoAlimento = animales.reduce((acc, a) => acc + ((a.pesoInicial || 0) * 0.02), 0).toFixed(1);

  // Costo mensual estimado (ejemplo $50 por animal)
  const costoMensual = animales.reduce((acc, a) => acc + 50, 0);

  const data = animales.map((a, i) => ({
    name: a.raza || `Animal ${i + 1}`,
    Peso: a.pesoInicial || 0,
    Costo: 50 // mismo costo estimado
  }));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard title="Animales" value={totalAnimales} color="green" />
        <StatCard title="Peso Promedio" value={`${pesoPromedio}kg`} color="blue" />
        <StatCard title="Costo Mensual" value={`$${costoMensual}`} color="pink" />
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