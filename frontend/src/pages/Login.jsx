import { useState } from "react";
import { login } from "../services/api";

export default function Login({ onLogin }) {
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await login(form);
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("usuario", JSON.stringify(res.data.usuario));
            onLogin(res.data.usuario);
        } catch (err) {
            console.error(err);
            setError("Email o contraseña incorrectos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 rounded-3xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-extrabold text-center mb-2">
                    <span className="mr-2">🏥</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">Chatbot Enfermería</span>
                </h1>
                <p className="text-center text-gray-500 font-medium mb-8">Sistema de Reservas de Laboratorios</p>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg mb-6 text-sm flex items-center shadow-sm">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email</label>
                    <input
                        type="email"
                        className="w-full bg-white/70 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 shadow-sm text-sm"
                        placeholder="correo@unisangil.edu.co"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Contraseña</label>
                    <input
                        type="password"
                        className="w-full bg-white/70 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 shadow-sm text-sm"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-2xl transition duration-300 shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5"
                >
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
            </div>
        </div>
    );
}