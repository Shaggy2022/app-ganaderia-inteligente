import StatCard from "../components/StatCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Ene", Peso: 200, Costo: 2200 },
  { name: "Feb", Peso: 210, Costo: 2300 },
  { name: "Mar", Peso: 220, Costo: 2500 },
  { name: "Abr", Peso: 230, Costo: 2700 },
  { name: "May", Peso: 240, Costo: 2900 },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6 mb-10">
        <StatCard title="Animales" value="120" color="green" />
        <StatCard title="Peso Promedio" value="230kg" color="blue" />
        <StatCard title="Costo Mensual" value="$2,300" color="pink" />
        <StatCard title="Consumo Alimento" value="540kg" color="yellow" />
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-4">Peso promedio vs Costo</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="name" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Line type="monotone" dataKey="Peso" stroke="#6EE7B7" strokeWidth={3} />
            <Line type="monotone" dataKey="Costo" stroke="#F472B6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}