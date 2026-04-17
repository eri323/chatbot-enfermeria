import { useState, useEffect, useRef } from "react";
import {
  getLaboratorios,
  verificarDisponibilidad,
  crearReservacion,
  verificarFestivo,
} from "../services/api";
import { supabase } from "../services/supabase";

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

  const agregarMensaje = (texto, tipo, opciones = null, datosReserva = null) => {
    setMensajes((prev) => [...prev, { texto, tipo, opciones, datosReserva }]);
  };

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

  useEffect(() => {
    // Escuchar cambios en tiempo real para avisar si algo cambia
    const channel = supabase
      .channel("chatbot_updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservaciones" },
        () => {
          // Si el usuario está en medio de una reserva, avisamos que hubo cambios
          if (estado.paso !== "ninguno") {
            agregarMensaje("📢 Se acaba de confirmar una nueva reserva. Verifica la disponibilidad si el horario que buscas ya no aparece.", "bot");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [estado.paso, usuario.id]);


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
        paso: "reserva_estudiantes_archivo",
        datos: { ...datos, materials: mensaje },
      });
      agregarMensaje("Por favor carga el archivo (CSV, PDF o Excel) con la lista de estudiantes para finalizar tu reserva.", "bot");
    } else if (paso === "reserva_estudiantes_archivo") {
      // Este paso se maneja ahora a través de handleFileChange
      return;
    } else if (paso === "reserva_estudiantes") {
      // Paso antiguo, mantenido por compatibilidad si es necesario, pero redireccionado
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
            "🎉 ¡Tu reserva se ha creado exitosamente!",
            "bot",
            null,
            {
              id: res.data.reservacion.id,
              laboratorio: datos.lab.nombre,
              fecha: datos.fecha,
              horario: `${datos.hora_inicio} - ${datos.hora_fin}`,
              practica: datos.practice_type,
              estudiantes: num_students
            }
          );
        }
      } catch (err) {
        console.error(err);
        if (err.response?.status === 409) {
          agregarMensaje(`❌ ${err.response.data.message}`, "bot");
        } else {
          agregarMensaje("❌ Error al crear la reserva. Por favor intenta de nuevo.", "bot");
        }
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    agregarMensaje(`📄 Archivo seleccionado: ${file.name}`, "user");
    
    const formData = new FormData();
    formData.append("laboratorio_id", estado.datos.lab.id);
    formData.append("usuario_id", usuario.id);
    formData.append("fecha", estado.datos.fecha);
    formData.append("hora_inicio", estado.datos.hora_inicio);
    formData.append("hora_fin", estado.datos.hora_fin);
    formData.append("practice_type", estado.datos.practice_type);
    formData.append("materials", estado.datos.materials);
    formData.append("lista_estudiantes", file);
    // num_students es opcional ahora

    try {
      const res = await crearReservacion(formData);
      if (res.data.success) {
        agregarMensaje(
          "🎉 ¡Tu reserva se ha creado exitosamente!",
          "bot",
          null,
          {
            id: res.data.reservacion.id,
            laboratorio: estado.datos.lab.nombre,
            fecha: estado.datos.fecha,
            horario: `${estado.datos.hora_inicio} - ${estado.datos.hora_fin}`,
            practica: estado.datos.practice_type,
            estudiantes: "Lista adjunta"
          }
        );
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        agregarMensaje(`❌ ${err.response.data.message}`, "bot");
      } else {
        agregarMensaje("❌ Error al crear la reserva. Por favor intenta de nuevo.", "bot");
      }
    }
    setEstado({ paso: "ninguno", datos: {} });
  };

  const ultimoMensaje = mensajes[mensajes.length - 1];
  const esperandoOpcion = ultimoMensaje?.tipo === "bot" && ultimoMensaje?.opciones?.length > 0;

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
              {msg.datosReserva && (
                <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 shadow-sm w-full">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-200">
                    <span className="text-xl">✅</span>
                    <h4 className="font-bold text-green-800 text-sm">Detalles de tu reserva</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-green-50">
                      <span className="text-gray-500 font-semibold">ID Reserva</span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">#{msg.datosReserva.id}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-green-50">
                      <span className="text-gray-500 font-semibold">Laboratorio</span>
                      <span className="font-medium text-gray-800 text-right">{msg.datosReserva.laboratorio}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-green-50">
                      <span className="text-gray-500 font-semibold">Fecha</span>
                      <span className="font-medium text-gray-800">{msg.datosReserva.fecha}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-green-50">
                      <span className="text-gray-500 font-semibold">Horario</span>
                      <span className="font-medium text-gray-800">{msg.datosReserva.horario}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-green-50">
                      <span className="text-gray-500 font-semibold">Práctica</span>
                      <span className="font-medium text-gray-800 text-right truncate max-w-[120px]" title={msg.datosReserva.practica}>{msg.datosReserva.practica}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm border border-green-50">
                      <span className="text-gray-500 font-semibold">Estudiantes</span>
                      <span className="font-medium text-gray-800">{msg.datosReserva.estudiantes}</span>
                    </div>
                  </div>
                </div>
              )}
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
        {estado.paso === "reserva_estudiantes_archivo" ? (
          <div className="flex-1 flex gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".csv,.pdf,.xlsx,.xls"
            />
            <label
              htmlFor="file-upload"
              className="flex-1 bg-blue-50 text-blue-700 border-2 border-dashed border-blue-200 rounded-2xl px-5 py-3 text-sm font-bold cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <span className="text-xl">📎</span> 
              <span>Subir lista de estudiantes</span>
            </label>
          </div>
        ) : (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !esperandoOpcion && handleEnviar()}
            placeholder={esperandoOpcion ? "Por favor selecciona una opción arriba..." : "Escribe tu mensaje..."}
            disabled={esperandoOpcion}
            className={`flex-1 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner ${esperandoOpcion ? "bg-gray-100 cursor-not-allowed opacity-70" : "bg-gray-50"}`}
          />
        )}
        <button
          onClick={handleEnviar}
          disabled={esperandoOpcion}
          className={`px-6 py-3 rounded-full text-sm font-bold shadow-md transform transition focus:outline-none ${esperandoOpcion ? "bg-gray-400 text-gray-100 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30 hover:-translate-y-0.5"}`}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
