import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const limpiarSesion = () => {
    Object.keys(localStorage)
        .filter((k) => k === 'token' || k === 'usuario' || k.startsWith('chat_'))
        .forEach((k) => localStorage.removeItem(k));
};

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url ?? '';
        const esLogin = url.includes('/auth/login') || url.includes('/auth/registro');

        if (!error.response) {
            toast.error('Error de conexión con el servidor. Verifica tu red.');
        } else if (error.response.status >= 500) {
            toast.error('Error interno del servidor. Intenta de nuevo más tarde.');
        } else if (error.response.status === 401 && !esLogin) {
            // Sesión inválida o expirada → cerrar sesión y volver a login
            limpiarSesion();
            toast.error('Tu sesión ha expirado. Inicia sesión nuevamente.');
            // Recarga suave: App.jsx leerá localStorage vacío y mostrará Login
            setTimeout(() => window.location.reload(), 600);
        }
        return Promise.reject(error);
    }
);


export const login = (datos) => API.post('/auth/login', datos);
export const registro = (datos) => API.post('/auth/registro', datos);


export const getLaboratorios = () => API.get('/laboratorios');


export const getReservaciones = () => API.get('/reservaciones');
export const crearReservacion = (datos) => API.post('/reservaciones', datos);
export const cancelarReservacion = (id, datos) => API.put(`/reservaciones/${id}/cancelar`, datos);
export const verificarDisponibilidad = (params) => API.get('/reservaciones/disponibilidad', { params });


export const getFestivos = () => API.get('/festivos');
export const verificarFestivo = (fecha) => API.get(`/festivos/verificar/${fecha}`);
export const getCalendario = () => API.get('/calendario');

export const getReservacionesUsuario = (id) => API.get(`/reservaciones/usuario/${id}`);
