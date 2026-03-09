import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
    const [usuario, setUsuario] = useState(() => {
        const saved = localStorage.getItem("usuario");
        return saved ? JSON.parse(saved) : null;
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