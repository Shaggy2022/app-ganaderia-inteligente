// src/pages/CalendarioVeterinario.jsx
import { useEffect, useState, useCallback } from "react";
import {
  getEventosVet,
  completarEventoVet,
  deleteEventoVet,
  clasificarEventos,
} from "../services/eventosVetService";

// ─── Helpers ─────────────────────────────────────────────────

const TIPOS_COLOR = {
  "Consulta veterinaria": { badge: "bg-blue-900 text-blue-300",    dot: "bg-blue-500"   },
  "Vacunación":           { badge: "bg-green-900 text-green-300",   dot: "bg-green-500"  },
  "Desparasitación":      { badge: "bg-yellow-900 text-yellow-300", dot: "bg-yellow-500" },
  "Cirugía":              { badge: "bg-red-900 text-red-300",       dot: "bg-red-500"    },
  "Otro tratamiento":     { badge: "bg-slate-700 text-slate-300",   dot: "bg-slate-400"  },
};

const ESTADO_BADGE = {
  vencido:    "bg-red-900 text-red-300",
  proximo:    "bg-yellow-900 text-yellow-300",
  pendiente:  "bg-blue-900 text-blue-300",
  completado: "bg-green-900 text-green-300",
};

const ESTADO_LABEL = {
  vencido:    "Vencido",
  proximo:    "Próximo",
  pendiente:  "Pendiente",
  completado: "Completado",
};

const fmtFecha = (f) => {
  if (!f) return { dia: "", mes: "" };
  const [, m, d] = f.split("-");
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return { dia: d, mes: meses[Number(m) - 1] };
};

// ─── Mini Calendario CON navegación ──────────────────────────

function MiniCalendario({ eventos }) {
  const hoy = new Date();

  // Estados para navegar entre meses ← fix principal
  const [mesActual,  setMesActual]  = useState(hoy.getMonth());
  const [yearActual, setYearActual] = useState(hoy.getFullYear());

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                 "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const irAnterior = () => {
    if (mesActual === 0) { setMesActual(11); setYearActual((y) => y - 1); }
    else setMesActual((m) => m - 1);
  };

  const irSiguiente = () => {
    if (mesActual === 11) { setMesActual(0); setYearActual((y) => y + 1); }
    else setMesActual((m) => m + 1);
  };

  const primerDia = new Date(yearActual, mesActual, 1).getDay();
  const diasEnMes = new Date(yearActual, mesActual + 1, 0).getDate();
  const offset    = (primerDia + 6) % 7;

  // Mapea qué días tienen eventos en el mes visible
  const diasConEventos = {};
  eventos.forEach((e) => {
    if (!e.fechaProgramada) return;
    const [y, m] = e.fechaProgramada.split("-").map(Number);
    if (y === yearActual && m - 1 === mesActual) {
      const d = Number(e.fechaProgramada.split("-")[2]);
      if (!diasConEventos[d]) diasConEventos[d] = [];
      diasConEventos[d].push(e);
    }
  });

  const celdas = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const esHoy = (d) =>
    d === hoy.getDate() &&
    mesActual === hoy.getMonth() &&
    yearActual === hoy.getFullYear();

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mt-6">

      {/* Navegación mes */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={irAnterior}
          className="text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-700 transition-all text-lg"
        >
          ←
        </button>
        <span className="text-white font-bold text-sm">
          {MESES[mesActual]} {yearActual}
        </span>
        <button
          onClick={irSiguiente}
          className="text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-slate-700 transition-all text-lg"
        >
          →
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Lu","Ma","Mi","Ju","Vi","Sá","Do"].map((d) => (
          <div key={d} className="text-center text-slate-500 text-xs font-semibold py-1">{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const evs          = diasConEventos[d] || [];
          const tieneVencido = evs.some((e) => e.estado === "vencido");

          return (
            <div
              key={d}
              className={`flex flex-col items-center p-1 rounded-lg text-xs
                ${esHoy(d)                                  ? "bg-indigo-600"     : ""}
                ${tieneVencido && !esHoy(d)                 ? "bg-red-900/40"     : ""}
                ${evs.length && !esHoy(d) && !tieneVencido ? "bg-slate-700/60"   : ""}
              `}
            >
              <span className={esHoy(d) ? "text-white font-bold" : "text-slate-300"}>{d}</span>
              {evs.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {evs.slice(0, 3).map((e, idx) => (
                    <span
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${TIPOS_COLOR[e.tipoServicio]?.dot || "bg-slate-400"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-700">
        {Object.entries(TIPOS_COLOR).slice(0, 4).map(([tipo, { dot }]) => (
          <span key={tipo} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {tipo.replace("Consulta veterinaria", "Consulta")}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Fila de evento ──────────────────────────────────────────

function EventoRow({ evento, onCompletar, onEliminar }) {
  const { dia, mes } = fmtFecha(evento.fechaProgramada);
  const completado   = evento.estado === "completado";

  return (
    <div className={`flex items-center gap-3 py-3 border-b border-slate-800 last:border-0
      ${evento.estado === "vencido" ? "opacity-90" : ""}
    `}>
      <div className="min-w-[38px] text-center flex-shrink-0">
        <div className={`text-lg font-bold leading-none
          ${evento.estado === "vencido"   ? "text-red-400"    : ""}
          ${evento.estado === "proximo"   ? "text-yellow-300" : ""}
          ${evento.estado === "pendiente" ? "text-slate-200"  : ""}
          ${completado                    ? "text-green-400"  : ""}
        `}>{dia}</div>
        <div className="text-xs text-slate-500 uppercase">{mes}</div>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${completado ? "line-through text-slate-500" : "text-white"}`}>
          {evento.tipoServicio} — {evento.animalNombre || evento.animalId}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {[evento.veterinario, evento.lote, evento.notas].filter(Boolean).join(" · ")}
        </p>
      </div>

      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${ESTADO_BADGE[evento.estado]}`}>
        {ESTADO_LABEL[evento.estado]}
      </span>

      {!completado && (
        <button
          onClick={() => onCompletar(evento.id)}
          className="text-xs px-2.5 py-1 rounded-lg border border-green-700 text-green-400 hover:bg-green-900 transition-colors flex-shrink-0"
        >
          ✓
        </button>
      )}
      <button
        onClick={() => onEliminar(evento)}
        className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-700 transition-colors flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Modal confirmación eliminar ─────────────────────────────

function ModalConfirmar({ evento, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-700 text-center">
        <div className="text-4xl mb-4">🗑️</div>
        <h3 className="text-white font-bold text-lg mb-2">¿Eliminar evento?</h3>
        <p className="text-slate-400 text-sm mb-6">
          Se eliminará{" "}
          <span className="text-white font-semibold">{evento.tipoServicio}</span>{" "}
          del animal{" "}
          <span className="text-white font-semibold">{evento.animalNombre || evento.animalId}</span>.
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onConfirmar}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl font-bold transition-all"
          >
            Sí, eliminar
          </button>
          <button
            onClick={onCancelar}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-xl font-bold transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────

export default function CalendarioVeterinario() {
  const [eventos, setEventos]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [alertaCerrada, setAlertaCerrada] = useState(false);
  const [filtro, setFiltro]               = useState("todos");
  const [tab, setTab]                     = useState("lista");
  const [eventoAEliminar, setEventoAEliminar] = useState(null); // ← fix confirm

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEventosVet();
      setEventos(data);
    } catch (e) {
      console.error("Error cargando eventos:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const { vencidos, proximos, pendientes, completados } = clasificarEventos(eventos);

  const handleCompletar = async (id) => {
    await completarEventoVet(id);
    cargar();
  };

  // Abre el modal de confirmación en lugar de window.confirm
  const handleEliminar = (evento) => {
    setEventoAEliminar(evento);
  };

  const confirmarEliminar = async () => {
    await deleteEventoVet(eventoAEliminar.id);
    setEventoAEliminar(null);
    cargar();
  };

  const eventosFiltrados = filtro === "todos"
    ? eventos
    : eventos.filter((e) => e.tipoServicio === filtro);

  const gruposPorEstado = [
    { label: "Vencidos",          evs: eventosFiltrados.filter((e) => e.estado === "vencido")   },
    { label: "Próximos (3 días)", evs: eventosFiltrados.filter((e) => e.estado === "proximo")   },
    { label: "Pendientes",        evs: eventosFiltrados.filter((e) => e.estado === "pendiente") },
    { label: "Completados",       evs: eventosFiltrados.filter((e) => e.estado === "completado")},
  ].filter((g) => g.evs.length > 0);

  const TIPOS_FILTRO = [
    "todos",
    "Consulta veterinaria",
    "Vacunación",
    "Desparasitación",
    "Cirugía",
    "Otro tratamiento",
  ];

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden mt-6">

      {/* HEADER */}
      <div className="p-8 bg-slate-800/50 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">CALENDARIO VETERINARIO</h2>
          <p className="text-slate-400 text-sm mt-1">Control sanitario programado por animal</p>
        </div>
        <span className="bg-slate-700 px-4 py-1 rounded-full text-sm text-white">
          {eventos.length} eventos
        </span>
      </div>

      {/* BANNER ALERTAS */}
      {!alertaCerrada && (vencidos.length > 0 || proximos.length > 0) && (
        <div className="mx-8 mt-6 bg-yellow-900/50 border border-yellow-600 text-yellow-200 rounded-xl px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl mt-0.5">⚠</span>
              <div>
                <p className="font-bold text-sm">
                  {vencidos.length > 0 && `${vencidos.length} evento(s) vencido(s)`}
                  {vencidos.length > 0 && proximos.length > 0 && " · "}
                  {proximos.length > 0 && `${proximos.length} evento(s) en los próximos 3 días`}
                </p>
                {proximos.length > 0 && (
                  <p className="text-xs text-yellow-300 mt-1">
                    {proximos.map((e) => `${e.tipoServicio} — ${e.animalNombre || e.animalId} (${e.fechaProgramada})`).join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setAlertaCerrada(true)}
              className="text-yellow-400 hover:text-yellow-200 text-lg leading-none flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4 px-8 mt-6">
        {[
          { label: "Vencidos",    val: vencidos.length,    color: "text-red-400"    },
          { label: "Próximos",    val: proximos.length,    color: "text-yellow-300" },
          { label: "Pendientes",  val: pendientes.length,  color: "text-blue-400"   },
          { label: "Completados", val: completados.length, color: "text-green-400"  },
        ].map((k) => (
          <div key={k.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-xs mb-1">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-0 border-b border-slate-700 mt-6 px-8">
        {["lista", "calendario"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-semibold capitalize border-b-2 transition-all
              ${tab === t
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            {t === "lista" ? "Lista" : "Calendario"}
          </button>
        ))}
      </div>

      <div className="px-8 py-6">

        {/* FILTROS */}
        <div className="flex gap-2 flex-wrap mb-5">
          {TIPOS_FILTRO.map((t) => (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${filtro === t
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700"}`}
            >
              {t === "todos" ? "Todos" : t}
            </button>
          ))}
        </div>

        {loading && (
          <div className="py-16 text-center text-slate-400">Cargando eventos...</div>
        )}

        {!loading && tab === "lista" && (
          <>
            {gruposPorEstado.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                No hay eventos programados. Agrégalos con el botón "Programar visita".
              </div>
            ) : (
              gruposPorEstado.map((grupo) => (
                <div key={grupo.label} className="mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {grupo.label}
                  </p>
                  <div className="bg-slate-800 rounded-xl border border-slate-700 px-4">
                    {grupo.evs.map((e) => (
                      <EventoRow
                        key={e.id}
                        evento={e}
                        onCompletar={handleCompletar}
                        onEliminar={handleEliminar}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {!loading && tab === "calendario" && (
          <MiniCalendario eventos={eventosFiltrados} />
        )}
      </div>

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
      {eventoAEliminar && (
        <ModalConfirmar
          evento={eventoAEliminar}
          onConfirmar={confirmarEliminar}
          onCancelar={() => setEventoAEliminar(null)}
        />
      )}
    </div>
  );
}
