import React, { useEffect, useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSaturday,
  isSunday,
} from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import es from "date-fns/locale/es";
import { getCalendario, getLaboratorios, getFestivos } from "../services/api";
import { supabase } from "../services/supabase";

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const HORARIOS = [
  { inicio: "08:00", fin: "10:00" },
  { inicio: "10:00", fin: "12:00" },
  { inicio: "12:00", fin: "14:00" },
  { inicio: "14:00", fin: "16:00" },
  { inicio: "16:00", fin: "18:00" },
];

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const label = () => {
    const date = toolbar.date;
    return format(date, 'MMMM yyyy', { locale: es }).replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <div className="flex items-center justify-between bg-white px-2 sm:px-6 py-4 rounded-t-2xl border-b border-gray-100/50 mb-2">
      <div className="flex items-center gap-3">
        <button
          onClick={goToCurrent}
          className="px-4 py-2 bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 text-sm font-bold rounded-xl transition-all shadow-sm border border-blue-100/50"
        >
          Hoy
        </button>
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200/60 rounded-xl p-1 shadow-inner">
          <button
            onClick={goToBack}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 hover:text-blue-600 focus:outline-none"
            title="Semana Anterior"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={goToNext}
            className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 hover:text-blue-600 focus:outline-none"
            title="Siguiente Semana"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 capitalize tracking-tight flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-500 hidden sm:block" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <span>{label()}</span>
      </h2>
    </div>
  );
};

export default function Calendario() {
  const [reservasDb, setReservasDb] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [festivos, setFestivos] = useState([]);
  const [selectedLab, setSelectedLab] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchReservas = () => {
    getCalendario()
      .then((res) => setReservasDb(res.data || []))
      .catch((err) => console.error("Error cargando reservas:", err));
  };

  useEffect(() => {
    // Cargar historial de reservas
    fetchReservas();

    // Cargar laboratorios y establecer valor por defecto
    getLaboratorios()
      .then((res) => {
        if (res.data?.laboratorios) {
          setLaboratorios(res.data.laboratorios);
          if (res.data.laboratorios.length > 0) {
            setSelectedLab(res.data.laboratorios[0].id.toString());
          }
        }
      })
      .catch((err) => console.error("Error cargando laboratorios:", err));

    // Cargar festivos si existen (si falla, no rompe el calendario)
    getFestivos()
      .then((res) => {
        if (res.data?.festivos) {
          const festivosStrings = res.data.festivos.map((f) => {
            const d = new Date(f.fecha);
            return d.toISOString().split("T")[0];
          });
          setFestivos(festivosStrings);
        }
      })
      .catch((err) => console.warn("Festivos no disponibles:", err));

    // SUSCRIPCIÓN EN TIEMPO REAL
    const channel = supabase
      .channel("reservaciones_cambios")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservaciones" },
        (payload) => {
          console.log("🔔 Cambio detectado en tiempo real:", payload);
          fetchReservas();
        }
      )
      .subscribe((status, err) => {
        console.log("📡 Estado de suscripción Realtime:", status);
        if (err) console.error("❌ Error en suscripción Realtime:", err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const events = useMemo(() => {
    if (!selectedLab) return [];

    // Filtrar las reservas por el laboratorio seleccionado
    const reservasLab = reservasDb.filter(
      (r) => r.laboratorio_id?.toString() === selectedLab,
    );

    // Generar eventos de reservas
    const reservedEvents = reservasLab.map((r) => ({
      id: `res-${r.id}`,
      title: `Reservado${r.usuario ? " - " + r.usuario : ""}`,
      start: new Date(r.fecha_inicio),
      end: new Date(r.fecha_fin),
      tipo: "reservado",
    }));

    // Determinar ventana de tiempo (mes actual +/- 1 mes)
    const startDateView = startOfMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
    const endDateView = endOfMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );

    const totalDays = eachDayOfInterval({
      start: startDateView,
      end: endDateView,
    });

    const availableEvents = [];

    // Generar bloques disponibles
    totalDays.forEach((dayDate) => {
      const dateStr = format(dayDate, "yyyy-MM-dd");

      // Saltamos fines de semana y festivos
      const esFindeSemana = isSaturday(dayDate) || isSunday(dayDate);
      const esFestivo = festivos.includes(dateStr);

      if (esFindeSemana || esFestivo) return;

      // Comprobamos cada franja de HORARIOS
      HORARIOS.forEach((h, index) => {
        const slotStart = new Date(`${dateStr}T${h.inicio}:00`);
        const slotEnd = new Date(`${dateStr}T${h.fin}:00`);

        const isReserved = reservasLab.some((r) => {
          const rStart = new Date(r.fecha_inicio);
          // Asignamos que si el punto de partida coincide, el bloque está ocupado
          return rStart.getTime() === slotStart.getTime();
        });

        if (!isReserved) {
          availableEvents.push({
            id: `av-${dateStr}-${index}`,
            title: "Libre",
            start: slotStart,
            end: slotEnd,
            tipo: "disponible",
          });
        }
      });
    });

    return [...reservedEvents, ...availableEvents];
  }, [reservasDb, selectedLab, currentDate, festivos]);

  // Asignar colores: Reservado = Rojo, Disponible = Verde
  const eventPropGetter = (event) => {
    if (event.tipo === "reservado") {
      return {
        style: {
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          color: "white",
          borderRadius: "8px",
          fontWeight: "600",
          boxShadow: "0 1px 3px rgba(239, 68, 68, 0.3)",
          border: "none",
        },
      };
    } else {
      return {
        style: {
          backgroundColor: "#f0fdf4",
          borderColor: "#bbf7d0",
          color: "#16a34a",
          borderRadius: "8px",
          fontWeight: "600",
          border: "1px dashed #86efac",
        },
      };
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <style dangerouslySetInnerHTML={{__html: `
        .rbc-calendar { font-family: inherit; border: none; }
        .rbc-time-header-content { border-left: none; }
        .rbc-time-content { border-top: none; }
        .rbc-timeslot-group { border-bottom: 1px solid #f3f4f6; min-height: 50px; }
        .rbc-day-bg { border-left: 1px solid #f9fafb; }
        .rbc-today { background-color: #f8fafc; }
        .rbc-header { padding: 12px 0; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb; border-left: none !important; }
        .rbc-allday-cell { display: none; }
        .rbc-time-view { border: none; }
        .rbc-time-view .rbc-header { border-bottom: none; }
        .rbc-event { padding: 4px 8px; transition: transform 0.2s; }
        .rbc-event:hover { transform: scale(1.02); z-index: 50; }
        .rbc-time-gutter .rbc-timeslot-group { border-bottom: none; }
        .rbc-label { color: #6b7280; font-weight: 500; font-size: 0.8rem; padding: 0 4px; }
        .rbc-day-slot .rbc-events-container { margin-right: 4px; }
      `}} />

      {laboratorios.length > 0 && (
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.03)] mx-1 transition-all">
          <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <span className="font-bold text-sm text-gray-800">
            Laboratorio:
          </span>
          <select
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="flex-1 bg-gray-50/50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 block p-2 cursor-pointer transition-all hover:bg-gray-100 outline-none"
          >
            {laboratorios.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.nombre} (Cap: {lab.capacidad})
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        className="flex-1 bg-white pt-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden w-full relative"
        style={{ minHeight: "500px" }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%", minHeight: "450px" }}
          date={currentDate}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          defaultView="work_week"
          views={["work_week"]}
          min={new Date(0, 0, 0, 8, 0, 0)}
          max={new Date(0, 0, 0, 18, 0, 0)}
          eventPropGetter={eventPropGetter}
          formats={{
            timeGutterFormat: "HH:mm",
            eventTimeRangeFormat: ({ start, end }) => `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`
          }}
          components={{
            toolbar: CustomToolbar
          }}
          messages={{
            noEventsInRange: "No hay reservas en este rango.",
          }}
        />
      </div>
    </div>
  );
}
