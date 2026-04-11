import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import es from 'date-fns/locale/es';
import { getCalendario } from '../services/api';

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

export default function Calendario() {
const [events, setEvents] = useState([]);

useEffect(() => {
    // Llama a la API para obtener las reservas
        getCalendario()
            .then(res => {
                const reservas = res.data.map(r => ({
                    title: r.titulo || 'Reserva',
                    start: new Date(r.fecha_inicio),
                    end: new Date(r.fecha_fin),
                }));
                setEvents(reservas);
            })
            .catch(() => setEvents([]));
}, []);

return (
    <div style={{ height: 500 }}>
    <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        messages={{
        next: "Sig.",
        previous: "Ant.",
        today: "Hoy",
        month: "Mes",
        week: "Semana",
        day: "Día",
        agenda: "Agenda",
        }}
    />
    </div>
);
}




