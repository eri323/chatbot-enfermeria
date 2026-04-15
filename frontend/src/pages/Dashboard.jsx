import { useState } from "react";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";

import MisReservas from "./MisReservas";
import Calendario from "./Calendario";


export default function Dashboard({ usuario, onLogout }) {
    const [pestanaActiva, setPestanaActiva] = useState("chatbot");

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex flex-col">
            <Navbar usuario={usuario} onLogout={onLogout} />
            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 gap-6 max-w-[90rem] mx-auto w-full">
                
                {/* Panel Izquierdo: Chatbot y Mis Reservas */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 w-full lg:max-w-md xl:max-w-xl flex flex-col z-10 relative overflow-hidden" style={{ height: "650px" }}>
                    
                    <div className="px-6 pt-5 pb-3 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPestanaActiva("chatbot")}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                                    pestanaActiva === "chatbot"
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                        : "bg-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                🤖 Asistente
                            </button>
                            <button
                                onClick={() => setPestanaActiva("reservas")}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                                    pestanaActiva === "reservas"
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                        : "bg-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                📋 Mis Reservas
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
                        {pestanaActiva === "chatbot" && <Chatbot usuario={usuario} />}
                        {pestanaActiva === "reservas" && (
                            <div className="flex-1 overflow-y-auto">
                                <MisReservas usuario={usuario} />
                            </div>
                        )}
                    </div>

                </div>

                {/* Panel Derecho: Calendario Visual */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 w-full lg:flex-1 flex flex-col z-10 relative overflow-hidden" style={{ height: "650px" }}>
                    <div className="px-6 pt-5 pb-3 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
                        <h2 className="text-lg font-bold text-gray-800 px-2 py-1">
                            🗓️ Calendario de Disponibilidad
                        </h2>
                    </div>
                    <div className="flex-1 p-6 bg-gray-50/50 overflow-y-auto w-full">
                        <Calendario />
                    </div>
                </div>

            </div>
        </div>
    );
}