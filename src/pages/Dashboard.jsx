// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import StatCard from "../components/StatCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [animales, setAnimales] = useState([]);
  const [totalCostos, setTotalCostos] = useState(0);
  const [consumoAlimento, setConsumoAlimento] = useState(0);
  const [data, setData] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // ✅ ANIMALES
      const animalesSnap = await getDocs(collection(db, "animales"));
      const animalesData = animalesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAnimales(animalesData);

      // ✅ INICIALIZAR DATA DE GRÁFICA
      let dataTemp = animalesData.map((a, i) => ({
        id: a.id,
        name: a.raza || `Animal ${i + 1}`,
        Peso: Number(a.pesoInicial || 0),
        Costo: 0,
      }));

      let costosGlobal = 0;

      // ✅ VACUNAS
      animalesData.forEach((a) => {
        (a.vaccines || []).forEach((v) => {
          const costo = Number(v.price || 0);
          costosGlobal += costo;

          const item = dataTemp.find((x) => x.id === a.id);
          if (item) item.Costo += costo;
        });
      });

      // ✅ MEDICAMENTOS
      const medsSnap = await getDocs(collection(db, "medicamentos"));
      medsSnap.forEach((doc) => {
        const d = doc.data();
        const costo = Number(d.costoTotal || 0);
        costosGlobal += costo;

        const item = dataTemp.find((x) => x.id === d.animalId);
        if (item) item.Costo += costo;
      });

      // ✅ SERVICIOS VETERINARIOS
      const servSnap = await getDocs(collection(db, "serviciosVeterinarios"));
      servSnap.forEach((doc) => {
        const d = doc.data();
        const costo = Number(d.costoTotal || 0);
        costosGlobal += costo;

        const item = dataTemp.find((x) => x.id === d.animalId);
        if (item) item.Costo += costo;
      });

      // ✅ ALIMENTACIÓN
      const foodSnap = await getDocs(collection(db, "alimentacion"));
      foodSnap.forEach((doc) => {
        const d = doc.data();
        const costo = Number(d.total || 0);
        costosGlobal += costo;

        const item = dataTemp.find((x) => x.id === d.animalId);
        if (item) item.Costo += costo;
      });

      // ✅ CONSUMO ALIMENTO (registroAlimentacion)
      let consumo = 0;

      const registroSnap = await getDocs(
        collection(db, "registroAlimentacion")
      );

      registroSnap.forEach((doc) => {
        consumo += Number(doc.data().cantidad || 0);
      });

      setConsumoAlimento(consumo);
      setTotalCostos(costosGlobal);
      setData(dataTemp);

    } catch (error) {
      console.error("Error Dashboard:", error);
    }
  };

  // ✅ KPIs
  const totalAnimales = animales.length;

  const pesoPromedio =
    animales.length > 0
      ? (
          animales.reduce(
            (acc, a) => acc + Number(a.pesoInicial || 0),
            0
          ) / animales.length
        ).toFixed(1)
      : 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Dashboard</h1>

      {/* ✅ TARJETAS */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard title="Animales" value={totalAnimales} color="green" />
        <StatCard
          title="Peso Promedio"
          value={`${pesoPromedio} kg`}
          color="blue"
        />
        <StatCard
          title="Costo Total"
          value={`$${totalCostos}`}
          color="pink"
        />
        <StatCard
          title="Consumo Alimento"
          value={`${consumoAlimento} kg`}
          color="yellow"
        />
      </div>

      {/* ✅ GRÁFICA CORRECTA */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">
          Peso vs Costo por Animal
        </h2>

        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis dataKey="name" stroke="#ccc" />

              {/* ✅ EJE PESO */}
              <YAxis
                yAxisId="left"
                stroke="#6EE7B7"
                label={{
                  value: "Peso (kg)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#6EE7B7",
                }}
              />

              {/* ✅ EJE COSTO */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#F472B6"
                label={{
                  value: "Costo ($)",
                  angle: 90,
                  position: "insideRight",
                  fill: "#F472B6",
                }}
              />

              <Tooltip />

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Peso"
                stroke="#6EE7B7"
                strokeWidth={3}
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Costo"
                stroke="#F472B6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-300 text-center py-12">
            No hay datos de animales para mostrar.
          </p>
        )}
      </div>
    </div>
  );
}
