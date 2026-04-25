const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const { ROLES } = require('../middleware/roles');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

const registroLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Has alcanzado el límite de registros. Intenta de nuevo más tarde.' },
});

router.post('/registro', registroLimiter, async (req, res) => {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
        return res.status(400).json({ success: false, message: 'Nombre, email y password son requeridos.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, rol_id) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email',
            [nombre, email, hashedPassword, ROLES.DOCENTE]
        );
        res.json({ success: true, usuario: result.rows[0] });
    } catch (error) {
        console.error('[registro]', error);
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'El email ya está registrado.' });
        }
        res.status(500).json({ success: false, message: 'No se pudo completar el registro.' });
    }
});


router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.email = $1',
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
        }
        const usuario = result.rows[0];
        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
        }
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol_id: usuario.rol_id, rol_nombre: usuario.rol_nombre },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({ success: true, token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol_id: usuario.rol_id, rol_nombre: usuario.rol_nombre } });
    } catch (error) {
        console.error('[login]', error);
        res.status(500).json({ success: false, message: 'No se pudo iniciar sesión.' });
    }
});

module.exports = router;