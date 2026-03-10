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


export const login = (datos) => API.post('/auth/login', datos);
export const registro = (datos) => API.post('/auth/registro', datos);


export const getLaboratorios = () => API.get('/laboratorios');


export const getReservaciones = () => API.get('/reservaciones');
export const crearReservacion = (datos) => API.post('/reservaciones', datos);
export const cancelarReservacion = (id, datos) => API.put(`/reservaciones/${id}/cancelar`, datos);
export const verificarDisponibilidad = (params) => API.get('/reservaciones/disponibilidad', { params });


export const getFestivos = () => API.get('/festivos');
export const verificarFestivo = (fecha) => API.get(`/festivos/verificar/${fecha}`);

export const getReservacionesUsuario = (id) => API.get(`/reservaciones/usuario/${id}`);