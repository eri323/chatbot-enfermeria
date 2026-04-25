const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Whitelist de orígenes (CORS_ORIGIN puede ser CSV; por defecto Vite dev/preview)
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

app.use(helmet());
app.use(cors({
    origin: (origin, cb) => {
        // permitir requests sin origin (curl, healthchecks)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin no permitido: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));


const authRoutes = require('./routes/auth');
const laboratoriosRoutes = require('./routes/laboratorios');

const reservacionesRoutes = require('./routes/reservaciones');
const festivosRoutes = require('./routes/festivos');
const calendarioRoutes = require('./routes/calendario');

app.use('/api/auth', authRoutes);
app.use('/api/laboratorios', laboratoriosRoutes);

app.use('/api/reservaciones', reservacionesRoutes);
app.use('/api/festivos', festivosRoutes);
app.use('/api/calendario', calendarioRoutes);


app.get('/', (req, res) => {
    res.json({ mensaje: 'Backend Chatbot Enfermería funcionando ✅' });
});

// Error handler central — evita filtrar detalles internos al cliente
app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    if (err && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'Archivo demasiado grande.' });
    }
    if (err && /Origin no permitido/.test(err.message)) {
        return res.status(403).json({ success: false, message: 'Origen no permitido.' });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
