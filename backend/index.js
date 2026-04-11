const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});