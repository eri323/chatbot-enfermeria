const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken, verificarPermiso } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');


// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/estudiantes');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


router.use(verificarToken); 
router.get('/usuario/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, l.nombre as laboratorio
            FROM reservaciones r
            JOIN laboratorios l ON r.laboratorio_id = l.id
            WHERE r.usuario_id = $1
            ORDER BY r.fecha ASC`,
            [req.params.id]
        );
        res.json({ success: true, reservaciones: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/disponibilidad', 
    verificarPermiso([1, 2, 3]),  
    async (req, res) => {
        const { laboratorio_id, fecha, hora_inicio, hora_fin } = req.query;
        try {
            const result = await pool.query(
                `SELECT * FROM reservaciones 
                WHERE laboratorio_id = $1 AND fecha = $2 AND estado = 'activa'
                AND ((hora_inicio <= $3 AND hora_fin > $3)
                OR (hora_inicio < $4 AND hora_fin > $3))`,
                [laboratorio_id, fecha, hora_inicio, hora_fin]
            );
            res.json({ success: true, disponible: result.rows.length === 0 });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);


router.get('/', 
    verificarPermiso([1, 3]),  
    async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT r.*, l.nombre as laboratorio, u.nombre as usuario
                FROM reservaciones r
                JOIN laboratorios l ON r.laboratorio_id = l.id
                JOIN usuarios u ON r.usuario_id = u.id
                ORDER BY r.fecha DESC`
            );
            res.json({ success: true, reservaciones: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);


router.post('/', 
    verificarPermiso([1, 2, 3]),  
    upload.single('lista_estudiantes'),
    async (req, res) => {
        const { laboratorio_id, usuario_id, fecha, hora_inicio, hora_fin, practice_type, materials, num_students } = req.body;
        const studentListPath = req.file ? req.file.filename : null;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // 1. Verificar disponibilidad nuevamente (Prevención de race condition)
            const checkResult = await client.query(
                `SELECT * FROM reservaciones 
                WHERE laboratorio_id = $1 AND fecha = $2 AND estado = 'activa'
                AND ((hora_inicio <= $3 AND hora_fin > $3)
                OR (hora_inicio < $4 AND hora_fin > $3))
                FOR UPDATE`,
                [laboratorio_id, fecha, hora_inicio, hora_fin]
            );

            if (checkResult.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ 
                    success: false, 
                    message: 'Lo sentimos, este horario ya no está disponible. Alguien más acaba de reservarlo.' 
                });
            }

            // 2. Insertar si está disponible
            const result = await client.query(
                `INSERT INTO reservaciones (laboratorio_id, usuario_id, fecha, hora_inicio, hora_fin, practice_type, materials, num_students, lista_estudiantes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [laboratorio_id, usuario_id, fecha, hora_inicio, hora_fin, practice_type, materials, num_students || null, studentListPath]
            );
            
            await client.query('COMMIT');
            res.json({ success: true, reservacion: result.rows[0] });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error al crear reservación:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            client.release();
        }
    }
);


router.put('/:id/cancelar', 
    verificarPermiso([1, 3]), 
    async (req, res) => {
        const { cancelada_por } = req.body;
        try {
            const result = await pool.query(
                `UPDATE reservaciones SET estado = 'cancelada', cancelada_por = $1 WHERE id = $2 RETURNING *`,
                [cancelada_por, req.params.id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Reservación no encontrada' });
            }
            res.json({ success: true, reservacion: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);



module.exports = router;