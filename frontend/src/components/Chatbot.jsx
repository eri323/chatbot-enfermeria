import { useState, useEffect, useRef } from "react";
import {
  getLaboratorios,
  verificarDisponibilidad,
  crearReservacion,
  verificarFestivo,
} from "../services/api";

export default function Chatbot({ usuario }) {
  const [mensajes, setMensajes] = useState(() => {
    const guardados = localStorage.getItem(`chat_mensajes_${usuario.id}`);
    return guardados
      ? JSON.parse(guardados)
      : [
          {
            texto:
              "¡Hola! Soy el asistente de reservas de laboratorios. ¿En qué te puedo ayudar?",
            tipo: "bot",
          },
        ];
  });
  const [input, setInput] = useState("");
  const [laboratorios, setLaboratorios] = useState([]);
  const [estado, setEstado] = useState({ paso: "ninguno", datos: {} });
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const chatRef = useRef(null);
  const limpiarChat = () => {
  const mensajeInicial = [
    {
      texto: "¡Hola! Soy el asistente de reservas de laboratorios. ¿En qué te puedo ayudar?",
      tipo: "bot",
    },
  ];

  setMensajes(mensajeInicial);
  localStorage.removeItem(`chat_mensajes_${usuario.id}`);
};

  const HORARIOS = [
    { inicio: "08:00", fin: "10:00" },
    { inicio: "10:00", fin: "12:00" },
    { inicio: "12:00", fin: "14:00" },
    { inicio: "14:00", fin: "16:00" },
    { inicio: "16:00", fin: "18:00" },
  ];

  const hoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    getLaboratorios().then((res) => setLaboratorios(res.data.laboratorios));
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [mensajes]);

  useEffect(() => {
    localStorage.setItem(`chat_mensajes_${usuario.id}`, JSON.stringify(mensajes));
  }, [mensajes, usuario.id]);

  const agregarMensaje = (texto, tipo) => {
    setMensajes((prev) => [...prev, { texto, tipo }]);
  };

  const esFindeSemana = (fecha) => {
    const dia = new Date(fecha + "T00:00:00").getDay();
    return dia === 0 || dia === 6;
  };

/*   const iniciarConsulta = async () => {
    if (!fechaSeleccionada) {
      agregarMensaje("⚠️ Por favor selecciona una fecha primero.", "bot");
      return;
    }
    if (esFindeSemana(fechaSeleccionada)) {
      agregarMensaje(
        `❌ El ${fechaSeleccionada} es fin de semana, no hay disponibilidad.`,
        "bot",
      );
      return;
    }
    try {
      const res = await verificarFestivo(fechaSeleccionada);
      if (res.data.esFestivo) {
        agregarMensaje(
          `❌ El ${fechaSeleccionada} es festivo, no hay disponibilidad.`,
          "bot",
        );
        return;
      }
    } catch (err) {
      console.error(err);
    }

    const lista = laboratorios.map((l) => `• ${l.nombre}`).join("\n");
    agregarMensaje(
      `📅 Fecha seleccionada: ${fechaSeleccionada}\n¿Qué laboratorio quieres consultar?\n${lista}`,
      "bot",
    );
    setEstado({ paso: "consulta_lab", datos: { fecha: fechaSeleccionada } });
  }; */

  const iniciarReserva = async () => {
    if (!fechaSeleccionada) {
      agregarMensaje("⚠️ Por favor selecciona una fecha primero.", "bot");
      return;
    }
    if (esFindeSemana(fechaSeleccionada)) {
      agregarMensaje(
        `❌ El ${fechaSeleccionada} es fin de semana, no puedes reservar.`,
        "bot",
      );
      return;
    }
    try {
      const res = await verificarFestivo(fechaSeleccionada);
      if (res.data.esFestivo) {
        agregarMensaje(
          `❌ El ${fechaSeleccionada} es festivo, no puedes reservar.`,
          "bot",
        );
        return;
      }
    } catch (err) {
      console.error(err);
    }

    const lista = laboratorios.map((l) => `• ${l.nombre}`).join("\n");
    agregarMensaje(
      `📅 Fecha seleccionada: ${fechaSeleccionada}\n¿Qué laboratorio quieres reservar?\n${lista}`,
      "bot",
    );
    setEstado({ paso: "reserva_lab", datos: { fecha: fechaSeleccionada } });
  };

  const manejarPaso = async (mensaje) => {
    const { paso, datos } = estado;

    if (paso === "consulta_lab") {
      const lab = laboratorios.find(
        (l) => l.nombre.toLowerCase() === mensaje.toLowerCase(),
      );
      if (!lab) {
        agregarMensaje("No encontré ese laboratorio. Intenta de nuevo.", "bot");
        return;
      }
      const horariosDisponibles = [];
      for (const h of HORARIOS) {
        const res = await verificarDisponibilidad({
          laboratorio_id: lab.id,
          fecha: datos.fecha,
          hora_inicio: h.inicio,
          hora_fin: h.fin,
        });
        horariosDisponibles.push({ ...h, disponible: res.data.disponible });
      }
      const texto = horariosDisponibles
        .map((h) => `${h.disponible ? "✅" : "❌"} ${h.inicio} - ${h.fin}`)
        .join("\n");
      agregarMensaje(
        `Disponibilidad de ${lab.nombre} el ${datos.fecha}:\n${texto}`,
        "bot",
      );
      setEstado({ paso: "ninguno", datos: {} });
    } else if (paso === "reserva_lab") {
      const lab = laboratorios.find(
        (l) => l.nombre.toLowerCase() === mensaje.toLowerCase(),
      );
      if (!lab) {
        agregarMensaje("No encontré ese laboratorio. Intenta de nuevo.", "bot");
        return;
      }
      const horariosDisponibles = [];
      for (const h of HORARIOS) {
        const res = await verificarDisponibilidad({
          laboratorio_id: lab.id,
          fecha: datos.fecha,
          hora_inicio: h.inicio,
          hora_fin: h.fin,
        });
        if (res.data.disponible) horariosDisponibles.push(h);
      }
      if (horariosDisponibles.length === 0) {
        agregarMensaje(
          `❌ No hay horarios disponibles para ${lab.nombre} el ${datos.fecha}.`,
          "bot",
        );
        setEstado({ paso: "ninguno", datos: {} });
        return;
      }
      const texto = horariosDisponibles
        .map((h) => `• ${h.inicio} - ${h.fin}`)
        .join("\n");
      agregarMensaje(
        `Horarios disponibles para ${lab.nombre}:\n${texto}\n\n¿Qué horario prefieres? (ej: 08:00-10:00)`,
        "bot",
      );
      setEstado({ paso: "reserva_horario", datos: { ...datos, lab } });
    } else if (paso === "reserva_horario") {
      const [hora_inicio, hora_fin] = mensaje.split("-");
      setEstado({
        paso: "reserva_practica",
        datos: {
          ...datos,
          hora_inicio: hora_inicio.trim(),
          hora_fin: hora_fin.trim(),
        },
      });
      agregarMensaje("¿Qué tipo de práctica se realizará?", "bot");
    } else if (paso === "reserva_practica") {
      setEstado({
        paso: "reserva_materiales",
        datos: { ...datos, practice_type: mensaje },
      });
      agregarMensaje("¿Qué materiales se usarán?", "bot");
    } else if (paso === "reserva_materiales") {
      setEstado({
        paso: "reserva_estudiantes",
        datos: { ...datos, materials: mensaje },
      });
      agregarMensaje("¿Cuántos estudiantes participarán?", "bot");
    } else if (paso === "reserva_estudiantes") {
      const num_students = parseInt(mensaje);
      if (isNaN(num_students) || num_students <= 0) {
        agregarMensaje(
          "Por favor ingresa un número válido de estudiantes.",
          "bot",
        );
        return;
      }
      try {
        const res = await crearReservacion({
          laboratorio_id: datos.lab.id,
          usuario_id: usuario.id,
          fecha: datos.fecha,
          hora_inicio: datos.hora_inicio,
          hora_fin: datos.hora_fin,
          practice_type: datos.practice_type,
          materials: datos.materials,
          num_students,
        });
        if (res.data.success) {
          agregarMensaje(
            `✅ ¡Reserva confirmada!\n• ID de reserva: #${res.data.reservacion.id}\n• Laboratorio: ${datos.lab.nombre}\n• Fecha: ${datos.fecha}\n• Horario: ${datos.hora_inicio} - ${datos.hora_fin}\n• Práctica: ${datos.practice_type}\n• Estudiantes: ${num_students}\n\n📌 Guarda tu ID para cancelar la reserva.`,
            "bot",
          );
        }
      } catch (err) {
        console.error(err);
        agregarMensaje("Error al crear la reserva.", "bot");
      }
      setEstado({ paso: "ninguno", datos: {} });
    } else {
      const msg = mensaje.toLowerCase();
      if (msg.includes("laboratorio") || msg.includes("labs")) {
        const lista = laboratorios
          .map((l) => `• ${l.nombre} (capacidad: ${l.capacidad})`)
          .join("\n");
        agregarMensaje(`Los laboratorios disponibles son:\n${lista}`, "bot");
      } else if (
        msg.includes("hola") ||
        msg.includes("buenos") ||
        msg.includes("buenas")
      ) {
        agregarMensaje(
          `¡Hola ${usuario?.nombre}! ¿En qué te puedo ayudar hoy?`,
          "bot",
        );
      } else {
        agregarMensaje(
          "Puedes preguntarme sobre:\n• Laboratorios disponibles\n• Consultar disponibilidad\n• Reservar laboratorio",
          "bot",
        );
      }
    }
  };

  const handleEnviar = () => {
    if (!input.trim()) return;
    agregarMensaje(input, "user");
    manejarPaso(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensajes.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.tipo === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] lg:max-w-md px-5 py-3 rounded-2xl text-sm whitespace-pre-line shadow-sm leading-relaxed ${
                msg.tipo === "user"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm"
                  : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {msg.texto}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t bg-white border-gray-100 flex flex-wrap gap-2 items-center justify-center sm:justify-start">
        <input
          type="date"
          min={hoy}
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
          className="border border-gray-200 bg-gray-50 rounded-full px-4 py-1.5 text-xs text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
        />
        <button
          onClick={iniciarReserva}
          className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs px-4 py-1.5 rounded-full transition-colors"
        >
          Reservar laboratorio
        </button>

        <button
          onClick={limpiarChat}
          className="bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold text-xs px-4 py-1.5 rounded-full transition-colors ml-auto sm:ml-0"
        >
          Limpiar Chat
        </button>
      </div>

      <div className="px-4 pb-4 pt-2 bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleEnviar()}
          placeholder="Escribe tu mensaje..."
          className="flex-1 border border-gray-200 bg-gray-50 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
        />
        <button
          onClick={handleEnviar}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-full text-sm font-bold shadow-md shadow-blue-500/30 transform transition hover:-translate-y-0.5 focus:outline-none"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
