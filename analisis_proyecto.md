# Análisis del Proyecto: ChatBot Enfermería

Este documento detalla el análisis arquitectónico, tecnológico y de experiencia de usuario (UX) del proyecto **ChatBotEnfermeria2**, reflejando la arquitectura optimizada tras su refactorización.

---

## 1. Tecnologías y Librerías Utilizadas

El proyecto utiliza un stack moderno (PERN extendido con Supabase) separado claramente entre frontend y backend:

### **Frontend (Vite + React 19)**
- **Framework Core**: React 19, react-router-dom (Enrutamiento).
- **Estilado**: Tailwind CSS v4 (`@tailwindcss/vite`) para utilidades de diseño responsivas.
- **Calendario**: `react-big-calendar` emparejado con `date-fns` para la localización y el manejo lógico de fechas.
- **Alertas y UI Global**: `react-hot-toast` para notificaciones asíncronas globales inyectadas al nivel de la App.
- **Comunicaciones HTTP**: `axios` enriquecido con interceptores asíncronos para control de fallos y JWT.
- **Tiempo Real**: `@supabase/supabase-js` (WebSockets).

### **Backend (Node.js + Express)**
- **Servidor Web**: `express` v5 (Beta/RC).
- **Base de Datos**: PostgreSQL conectado con `pg` y extendido a través de `@supabase/supabase-js`.
- **Autenticación y Seguridad**: `jsonwebtoken` (JWTs) y `bcryptjs` (passwords).
- **Manejo de Archivos**: `multer` configurado para procesar documentos de estudiantes anexados a las reservas.

---

## 2. Flujo en Tiempo Real (Realtime)

La integración del "Realtime" WebSockets es excelente y escalable:

- **Calendario en Vivo (`Calendario.jsx`)**: Se suscribe al canal `reservaciones_cambios` mitigando colisiones de frontend mediante `fetchReservas()`.
- **Estabilidad de Suscripciones WebSockets (`Chatbot.jsx`)**: El chatbot implementa el canal preventivo `chatbot_updates`. Se utiliza un patrón robusto con Hooks (`useRef`) para que la suscripción no deba reactivarse ni reconectarse por cada iteración del flujo del usuario (memory-leak resuelto), operando sobre una única conexión persistente hacia el servidor.

---

## 3. Arquitectura del Motor Conversacional (Chatbot)

La escalabilidad del motor del chatbot está bien protegida del código espagueti. En el archivo `Chatbot.jsx`, la toma de decisiones descansa sobre el patrón de diseño de **Diccionario Estratégico (State Dictionary Object)**. Todo el flujo de respuestas (`pasosHandler`) es accesible a modo dinámico (`O(1)`), eliminando la dependencia de anidaciones en cascada `if/else if` y centralizando la semántica en métodos aislados como:

- `reserva_lab: async () => {}`
- `reserva_horario: async () => {}`

Esto significa que agregar nuevas conversaciones (ej. `cancelar_reserva`) solo requiere añadir una llave nueva al objeto de pasos.

---

## 4. UI/UX y Sistema de Manejo de Errores

La interfaz cuenta con Layout vertical fluido y visuales premium con Tailwind (blur, border-radius redondeados, gradientes modernos).

**Estrategia de Errores Globales (Toast + Axios)**
- Gracias al sistema de interceptores, el usuario no sufrirá de componentes bloqueados (fallas silenciosas). Cualquier código de estado `500+` desde el Backend o fallos del tipo "Network Error" (desconexiones) invocarán a `react-hot-toast` disparando una alerta roja y amigable que le indica al usuario que la plataforma experimenta interacciones fuera de su control. 
- La inyección se hace desde `App.jsx`, lo que engloba absolutamente todo (Dashboard, Chatbot, MisReservas y Autenticación).
