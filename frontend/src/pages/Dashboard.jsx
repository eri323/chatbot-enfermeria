import { useState } from "react";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";
import MisReservas from "./MisReservas";

export default function Dashboard({ usuario, onLogout }) {
    const [pestanaActiva, setPestanaActiva] = useState("chatbot");

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex flex-col">
            <Navbar usuario={usuario} onLogout={onLogout} />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 w-full max-w-2xl flex flex-col z-10 relative overflow-hidden" style={{ height: "650px" }}>
                    
                  
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

                            <button
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                                    pestanaActiva === "calendario"
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                        : "bg-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                🗓️ Calendario
                            </button>
                        </div>
                    </div>

                 
                    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
                        {pestanaActiva === "chatbot" ? (
                            <Chatbot usuario={usuario} />
                        ) : (
                            <div className="flex-1 overflow-y-auto">
                                <MisReservas usuario={usuario} />
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}