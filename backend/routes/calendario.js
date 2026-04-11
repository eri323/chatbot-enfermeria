(function() {
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Endpoint para obtener todas las reservas en formato para el calendario
router.get('/', async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT r.*, l.nombre as laboratorio, u.nombre as usuario
			FROM reservaciones r
			JOIN laboratorios l ON r.laboratorio_id = l.id
			JOIN usuarios u ON r.usuario_id = u.id
			ORDER BY r.fecha DESC`
		);
		const reservas = result.rows.map(r => ({
			titulo: `${r.laboratorio} - ${r.usuario}`,
			fecha_inicio: new Date(`${r.fecha}T${r.hora_inicio}`).toISOString(),
			fecha_fin: new Date(`${r.fecha}T${r.hora_fin}`).toISOString(),
			...r
		}));
		res.json(reservas);
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

module.exports = router;
})();
