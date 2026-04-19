import axios from 'axios';

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

import toast from 'react-hot-toast';

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            toast.error("Error de conexión con el servidor. Verifica tu red.");
        } else if (error.response.status >= 500) {
            toast.error("Error interno del servidor. Intenta de nuevo más tarde.");
        } else if (error.response.status === 401) {
            // No hacer toast para 401 si se maneja localmente, o sí:
            if(window.location.pathname !== "/") {
                toast.error("Tu sesión ha expirado o no estás autorizado.");
            }
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