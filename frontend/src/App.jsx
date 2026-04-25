import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { Toaster } from "react-hot-toast";

export default function App() {
    const [usuario, setUsuario] = useState(() => {
        const saved = localStorage.getItem("usuario");
        const token = localStorage.getItem("token");

        if (!saved || !token) return null;

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const expirado = payload.exp * 1000 < Date.now();
            if (expirado) {
                localStorage.removeItem("usuario");
                localStorage.removeItem("token");
                return null;
            }
        } catch {
            return null;
        }

        return JSON.parse(saved);
    });

    const handleLogin = (usuario) => {
        setUsuario(usuario);
    };

    const handleLogout = () => {
        Object.keys(localStorage)
            .filter((k) => k === "token" || k === "usuario" || k.startsWith("chat_"))
            .forEach((k) => localStorage.removeItem(k));
        setUsuario(null);
    };

    return (
        <>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            {usuario ? (
                <Dashboard usuario={usuario} onLogout={handleLogout} />
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </>
    );
}