import { useState, useEffect, useCallback } from "react";
import { getReservacionesUsuario, cancelarReservacion, getReservaciones } from "../services/api";

export default function MisReservas({ usuario }) {
    const [reservaciones, setReservaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const cargarReservas = useCallback(async () => {
        try {
            const isAdminOrJefe = ['admin', 'jefe_enfermeria'].includes(usuario.rol_nombre);
            const res = await (isAdminOrJefe ? getReservaciones() : getReservacionesUsuario(usuario.id));
            setReservaciones(res.data.reservaciones);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [usuario.id, usuario.rol_nombre]);

    useEffect(() => {
        cargarReservas();
    }, [cargarReservas]);

    const handleCancelar = async (id) => {
        if (!confirm("¿Estás seguro de cancelar esta reserva?")) return;
        try {
            await cancelarReservacion(id, { cancelada_por: usuario.id });
            cargarReservas();
        } catch (err) {
            console.error(err);
            alert("Error al cancelar la reserva");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Cargando reservas...</p>
        </div>
    );

    const activas = reservaciones.filter(r => r.estado === 'activa');
    const canceladas = reservaciones.filter(r => r.estado === 'cancelada');

    const renderReserva = (r, isActiva) => (
        <div key={r.id} className={`border rounded-xl p-4 shadow-sm ${isActiva ? 'bg-white border-green-200 border-l-4 border-l-green-500' : 'bg-red-50 border-red-200 border-l-4 border-l-red-500 opacity-90'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActiva ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isActiva ? 'Activa' : 'Cancelada'} - ID #{r.id}
                    </span>
                    <h3 className="font-semibold text-gray-800 mt-2">🔬 {r.laboratorio}</h3>
                    <p className="text-sm text-gray-600">📅 {r.fecha}</p>
                    <p className="text-sm text-gray-600">⏰ {r.hora_inicio} - {r.hora_fin}</p>
                    <p className="text-sm text-gray-600">🧪 {r.practice_type}</p>
                    <p className="text-sm text-gray-600">👥 {r.num_students} estudiantes</p>
                    {r.usuario && <p className="text-sm text-gray-500 mt-1">👤 Reservado por: {r.usuario}</p>}
                </div>
                {isActiva && ['admin', 'jefe_enfermeria'].includes(usuario.rol_nombre) && (
                    <button
                        onClick={() => handleCancelar(r.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg"
                    >
                        Cancelar
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
                {['admin', 'jefe_enfermeria'].includes(usuario.rol_nombre) ? "📋 Todas las Reservas" : "📋 Mis Reservas"}
            </h2>
            {reservaciones.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay reservas registradas.</p>
            ) : (
                <div className="space-y-6">
                   
                    <div>
                        <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                            🟢 Reservas Activas ({activas.length})
                        </h3>
                        {activas.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No hay reservas activas.</p>
                        ) : (
                            <div className="space-y-3">
                                {activas.map(r => renderReserva(r, true))}
                            </div>
                        )}
                    </div>

                  
                    <div>
                        <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2 pt-4 border-t">
                            🔴 Reservas Canceladas ({canceladas.length})
                        </h3>
                        {canceladas.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No hay reservas canceladas.</p>
                        ) : (
                            <div className="space-y-3">
                                {canceladas.map(r => renderReserva(r, false))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}