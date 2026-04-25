const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken); 

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM festivos ORDER BY fecha');
        res.json({ success: true, festivos: result.rows });
    } catch (error) {
        console.error('[festivos]', error);
        res.status(500).json({ success: false, message: 'No se pudo obtener la información de festivos.' });
    }
});


router.get('/verificar/:fecha', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM festivos WHERE fecha = $1',
            [req.params.fecha]
        );
        res.json({ success: true, esFestivo: result.rows.length > 0 });
    } catch (error) {
        console.error('[festivos]', error);
        res.status(500).json({ success: false, message: 'No se pudo obtener la información de festivos.' });
    }
});

module.exports = router;