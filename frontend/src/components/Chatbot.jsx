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
              `¡Hola${usuario?.nombre ? ' ' + usuario.nombre : ''}! Soy el asistente de reservas de laboratorios.\n\nPara iniciar, por favor selecciona una fecha en el selector resaltado en la parte inferior y luego haz clic en "Reservar laboratorio".\n\n¿En qué te puedo ayudar?`,
            tipo: "bot",
          },
        ];
  });
  const [input, setInput] = useState("");
  const [laboratorios, setLaboratorios] = useState([]);
  const [estado, setEstado] = useState(() => {
    const guardado = localStorage.getItem(`chat_estado_${usuario.id}`);
    return guardado ? JSON.parse(guardado) : { paso: "ninguno", datos: {} };
  });
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    return localStorage.getItem(`chat_fecha_${usuario.id}`) || "";
  });
  const chatRef = useRef(null);
  const limpiarChat = () => {
  const mensajeInicial = [
    {
      texto: `¡Hola${usuario?.nombre ? ' ' + usuario.nombre : ''}! Soy el asistente de reservas de laboratorios.\n\nPara iniciar, por favor selecciona una fecha en el selector resaltado en la parte inferior y luego haz clic en "Reservar laboratorio".\n\n¿En qué te puedo ayudar?`,
      tipo: "bot",
    },
  ];

  setMensajes(mensajeInicial);
  setEstado({ paso: "ninguno", datos: {} });
  setFechaSeleccionada("");
  localStorage.removeItem(`chat_mensajes_${usuario.id}`);
  localStorage.removeItem(`chat_estado_${usuario.id}`);
  localStorage.removeItem(`chat_fecha_${usuario.id}`);
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

  useEffect(() => {
    localStorage.setItem(`chat_estado_${usuario.id}`, JSON.stringify(estado));
  }, [estado, usuario.id]);

  useEffect(() => {
    localStorage.setItem(`chat_fecha_${usuario.id}`, fechaSeleccionada);
  }, [fechaSeleccionada, usuario.id]);

  const agregarMensaje = (texto, tipo, opciones = null) => {
    setMensajes((prev) => [...prev, { texto, tipo, opciones }]);
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

    const opcionesLabs = laboratorios.map((l) => l.nombre);
    agregarMensaje(
      `📅 Fecha seleccionada: ${fechaSeleccionada}\n¿Qué laboratorio quieres reservar?`,
      "bot",
      opcionesLabs
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
      const opcionesHorarios = horariosDisponibles.map((h) => `${h.inicio} - ${h.fin}`);
      agregarMensaje(
        `Horarios disponibles para ${lab.nombre}:\n\n¿Qué horario prefieres?`,
        "bot",
        opcionesHorarios
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

  const handleOpcionClick = (opcion) => {
    agregarMensaje(opcion, "user");
    manejarPaso(opcion);
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
              {msg.opciones && msg.opciones.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {msg.opciones.map((opc, idx) => {
                    const isLastMsg = i === mensajes.length - 1;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOpcionClick(opc)}
                        disabled={!isLastMsg}
                        className={`text-sm px-4 py-2 rounded-xl font-medium transition-all text-left border ${
                          isLastMsg
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-sm"
                            : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-70"
                        }`}
                      >
                        {opc}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t bg-white border-gray-100 flex flex-wrap gap-3 items-center justify-center sm:justify-start">
        <div className="flex items-center gap-2 bg-blue-50/60 p-1.5 rounded-full border border-blue-200 shadow-sm ring-2 ring-blue-100/50">
          <span className="text-[11px] font-bold text-blue-800 pl-3 uppercase tracking-wide">📅 Fecha:</span>
          <input
            type="date"
            min={hoy}
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="border-none bg-white rounded-full px-3 py-1.5 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm cursor-pointer"
          />
        </div>
        <button
          onClick={iniciarReserva}
          className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold text-xs px-5 py-2.5 rounded-full transition-colors shadow-sm"
        >
          Reservar laboratorio
        </button>

        <button
          onClick={limpiarChat}
          className="bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold text-xs px-4 py-2.5 rounded-full transition-colors ml-auto sm:ml-0"
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
