import { useState, useEffect } from "react";
import { getReservacionesUsuario, cancelarReservacion } from "../services/api";

export default function MisReservas({ usuario }) {
    const [reservaciones, setReservaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const cargarReservas = async () => {
        try {
            const res = await getReservacionesUsuario(usuario.id);
            setReservaciones(res.data.reservaciones);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarReservas();
    }, []);

    const handleCancelar = async (id) => {
        if (!confirm("¿Estás seguro de cancelar esta reserva?")) return;
        try {
            await cancelarReservacion(id, { cancelada_por: usuario.id });
            cargarReservas();
        } catch (err) {
            alert("Error al cancelar la reserva");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Cargando reservas...</p>
        </div>
    );

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Mis Reservas</h2>
            {reservaciones.length === 0 ? (
                <p className="text-gray-500 text-sm">No tienes reservas activas.</p>
            ) : (
                <div className="space-y-3">
                    {reservaciones.map(r => (
                        <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                        ID #{r.id}
                                    </span>
                                    <h3 className="font-semibold text-gray-800 mt-1">🔬 {r.laboratorio}</h3>
                                    <p className="text-sm text-gray-600">📅 {r.fecha}</p>
                                    <p className="text-sm text-gray-600">⏰ {r.hora_inicio} - {r.hora_fin}</p>
                                    <p className="text-sm text-gray-600">🧪 {r.practice_type}</p>
                                    <p className="text-sm text-gray-600">👥 {r.num_students} estudiantes</p>
                                </div>
                                <button
                                    onClick={() => handleCancelar(r.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}