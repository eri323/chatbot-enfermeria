const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken, verificarPermiso } = require('../middleware/auth');
const { ROLES } = require('../middleware/roles');

router.use(verificarToken);
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM laboratorios WHERE activo = true');
        res.json({ success: true, laboratorios: result.rows });
    } catch (error) {
        console.error('[laboratorios]', error);
        res.status(500).json({ success: false, message: 'No se pudo procesar la solicitud.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM laboratorios WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Laboratorio no encontrado' });
        }
        res.json({ success: true, laboratorio: result.rows[0] });
    } catch (error) {
        console.error('[laboratorios]', error);
        res.status(500).json({ success: false, message: 'No se pudo procesar la solicitud.' });
    }
});


router.post('/', verificarPermiso([ROLES.ADMIN]), async (req, res) => {
    const { nombre, capacidad, descripcion, equipos } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO laboratorios (nombre, capacidad, descripcion, equipos) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, capacidad, descripcion, equipos]
        );
        res.json({ success: true, laboratorio: result.rows[0] });
    } catch (error) {
        console.error('[laboratorios]', error);
        res.status(500).json({ success: false, message: 'No se pudo procesar la solicitud.' });
    }
});

module.exports = router;