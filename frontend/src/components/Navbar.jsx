export default function Navbar({ usuario, onLogout }) {
    return (
        <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold">🏥 Chatbot Enfermería</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm">👤 {usuario?.nombre}</span>
                <button
                    onClick={onLogout}
                    className="bg-white text-blue-700 px-4 py-1 rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
                >
                    Cerrar sesión
                </button>
            </div>
        </nav>
    );
}