import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

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
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setUsuario(null);
    };

    return usuario ? (
        <Dashboard usuario={usuario} onLogout={handleLogout} />
    ) : (
        <Login onLogin={handleLogin} />
    );
}