(function () {
	const express = require('express');
	const router = express.Router();
	const pool = require('../db');

	// Endpoint para obtener todas las reservas activas en formato para el calendario
	router.get('/', async (req, res) => {
		try {
			const result = await pool.query(
				`SELECT r.*, l.nombre as laboratorio, u.nombre as usuario
			FROM reservaciones r
			JOIN laboratorios l ON r.laboratorio_id = l.id
			JOIN usuarios u ON r.usuario_id = u.id
			WHERE r.estado = 'activa'
			ORDER BY r.fecha DESC`
			);
			const reservas = result.rows.map(r => {
				const fechaStr = new Date(r.fecha).toISOString().split('T')[0];
				return {
					titulo: `${r.laboratorio} - ${r.usuario}`,
					fecha_inicio: new Date(`${fechaStr}T${r.hora_inicio}-05:00`).toISOString(),
					fecha_fin: new Date(`${fechaStr}T${r.hora_fin}-05:00`).toISOString(),
					...r
				};
			});
			res.json(reservas);
		} catch (error) {
			res.status(500).json({ success: false, message: error.message });
		}
	});

	module.exports = router;
})();