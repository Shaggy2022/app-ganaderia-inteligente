import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getHistorialByAnimal } from "../services/historialService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export default function AnimalProfile() {
  const { id } = useParams();

  const [animal, setAnimal] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    const ref = doc(db, "animales", id);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setAnimal({ id: snap.id, ...snap.data() });
    }

    const historial = await getHistorialByAnimal(id);

    // 🔥 convertir vacunas a eventos
    const vacunas = (snap.data().vaccines || []).map((v, index) => ({
      id: "vac-" + index,
      fecha: v.date,
      descripcion: v.name || "Vacuna aplicada",
      tipo: "vacuna",
      costo: Number(v.price || 0)
    }));

    // 🔥 unir todo
    setEvents([...historial, ...vacunas]);
  };

  const totalCostos = events.reduce((acc, e) => acc + (e.costo || 0), 0);

  if (!animal) return <div className="p-10 text-white">Cargando...</div>;

  const getIconoEspecie = (especie) => {
  const esp = (especie || "").toLowerCase();

  if (esp.includes("bovino")) return "🐄";     // vaca
  if (esp.includes("porcino")) return "🐖";    // cerdo
  if (esp.includes("ovino")) return "🐑";      // oveja
  if (esp.includes("caprino")) return "🐐";    // cabra
  if (esp.includes("equino")) return "🐎";     // caballo
  if (esp.includes("aves") || esp.includes("pollo")) return "🐔";

  return "🐾"; // default
  };

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-black flex items-center gap-2">
          <span className="text-3xl">
            {getIconoEspecie(animal.especie)}
          </span>
          {animal.raza}
        </h1>
        <p className="text-gray-400 text-sm">ID: {animal.id}</p>
      </div>

      {/* CARD RESUMEN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl shadow">
          <p className="text-xs text-gray-400">Especie</p>
          <p className="text-lg font-bold">{animal.especie}</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl shadow">
          <p className="text-xs text-gray-400">Categoría</p>
          <p className="text-lg font-bold">{animal.categoria}</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl shadow">
          <p className="text-xs text-gray-400">Precio Venta</p>
          <p className="text-lg font-bold">
            ${animal.precioVenta || 0}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-700/40 to-red-900 p-4 rounded-xl shadow">
          <p className="text-xs text-red-300">Costos</p>
          <p className="text-lg font-bold text-red-400">
            ${totalCostos}
          </p>
        </div>
      </div>

      {/* HISTORIAL */}
      <h2 className="text-xl font-bold mb-4">Historial del Animal</h2>

      {events.length === 0 ? (
        <div className="bg-slate-800 p-6 rounded-xl text-center text-gray-400">
          🧾 No hay eventos registrados
        </div>
      ) : (
        <div className="relative">

          {/* Línea */}
          <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-purple-500"></div>

          <div className="space-y-6">
            {events.map((e) => {

              const desc = (e.descripcion || "").toLowerCase();

              let tipoLabel = "Evento";
              let tipoIcon = "📌";
              let tipoColor = "bg-gray-600";

              if (e.tipo === "sanitario") {
                tipoLabel = "Evento Veterinario";
                tipoIcon = "🩺";
                tipoColor = "bg-blue-600";
              }

              if (desc.includes("vacuna")) {
                tipoLabel = "Vacuna";
                tipoIcon = "💉";
                tipoColor = "bg-green-600";
              }

              if (e.tipo === "medicamento") {
                tipoLabel = "Medicamento";
                tipoIcon = "💊";
                tipoColor = "bg-red-600";
              }

              if (e.tipo === "costo") {
                tipoLabel = "Costo";
                tipoIcon = "💰";
                tipoColor = "bg-yellow-600";
              }

              if (e.tipo === "servicioVeterinario") {
                tipoLabel = "Servicio Veterinario";
                tipoIcon = "🩺💰";
                tipoColor = "bg-purple-600";
              }

              if (e.tipo === "alimento") {
                tipoLabel = "Alimentación";
                tipoIcon = "🌾";
                tipoColor = "bg-green-600";
              }

              return (
                <div key={e.id} className="relative pl-10">

                  {/* Punto */}
                  <div className="absolute left-[6px] top-2 w-4 h-4 rounded-full bg-purple-500"></div>

                  {/* Card */}
                  <div className="bg-slate-800 p-4 rounded-xl shadow hover:scale-[1.01] transition">

                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-400">
                        📅 {e.fecha}
                      </p>

                      <span className={`text-xs px-2 py-1 rounded ${tipoColor}`}>
                        {tipoIcon} {tipoLabel}
                      </span>
                    </div>

                    <p className="mt-2 font-semibold">
                      {e.descripcion}
                    </p>

                    {e.costo > 0 && (
                      <p className="text-sm text-red-400 mt-1">
                        − ${e.costo}
                      </p>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
