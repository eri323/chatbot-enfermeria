import { useState } from "react";
import Navbar from "../components/Navbar";
import Chatbot from "../components/Chatbot";
import MisReservas from "./MisReservas";

export default function Dashboard({ usuario, onLogout }) {
    const [pestanaActiva, setPestanaActiva] = useState("chatbot");

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar usuario={usuario} onLogout={onLogout} />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl flex flex-col" style={{ height: "650px" }}>
                    
                    {/* Header con pestañas */}
                    <div className="px-6 pt-4 border-b">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setPestanaActiva("chatbot")}
                                className={`pb-3 text-sm font-semibold border-b-2 transition ${
                                    pestanaActiva === "chatbot"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                🤖 Asistente
                            </button>
                            <button
                                onClick={() => setPestanaActiva("reservas")}
                                className={`pb-3 text-sm font-semibold border-b-2 transition ${
                                    pestanaActiva === "reservas"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                📋 Mis Reservas
                            </button>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 overflow-hidden flex flex-col">
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