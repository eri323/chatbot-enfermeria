export default function Navbar({ usuario, onLogout }) {
    return (
        <nav className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex justify-between items-center shadow-lg border-b border-indigo-600/50">
            <div className="flex items-center gap-3">
                <span className="text-xl font-bold tracking-tight">🏥 Chatbot Enfermería</span>
            </div>
            <div className="flex items-center gap-5">
                <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-sm font-semibold">{usuario?.nombre}</span>
                    <span className="text-[10px] uppercase tracking-wider text-blue-200">{usuario?.rol_nombre}</span>
                </div>
                <button
                    onClick={onLogout}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm"
                >
                    Cerrar sesión
                </button>
            </div>
        </nav>
    );
}