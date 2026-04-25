const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db');
const { verificarToken, verificarPermiso } = require('../middleware/auth');
const { PUEDEN_RESERVAR, PUEDEN_VER_TODAS, PUEDEN_CANCELAR, esGestor } = require('../middleware/roles');
const multer = require('multer');
const path = require('path');
const supabase = require('../supabase');


const ALLOWED_FILE_EXT = new Set(['.csv', '.pdf', '.xlsx', '.xls']);
const ALLOWED_FILE_MIME = new Set([
    'text/csv',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream', // algunos navegadores envían csv como octet-stream
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const okExt = ALLOWED_FILE_EXT.has(ext);
        const okMime = ALLOWED_FILE_MIME.has(file.mimetype);
        if (!okExt || !okMime) {
            return cb(new Error('Formato de archivo no permitido. Usa CSV, PDF o Excel.'));
        }
        cb(null, true);
    },
});



router.use(verificarToken);
router.get('/usuario/:id', async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId)) {
        return res.status(400).json({ success: false, message: 'ID inválido.' });
    }
    const esPropio = targetId === req.usuario.id;
    if (!esPropio && !esGestor(req.usuario.rol_id)) {
        return res.status(403).json({ success: false, message: 'Solo puedes consultar tus propias reservas.' });
    }
    try {
        const result = await pool.query(
            `SELECT r.*, l.nombre as laboratorio
            FROM reservaciones r
            JOIN laboratorios l ON r.laboratorio_id = l.id
            WHERE r.usuario_id = $1
            ORDER BY r.fecha ASC`,
            [targetId]
        );
        res.json({ success: true, reservaciones: result.rows });
    } catch (error) {
        console.error('[reservaciones usuario]', error);
        res.status(500).json({ success: false, message: 'No se pudieron obtener las reservaciones.' });
    }
});

router.get('/disponibilidad',
    verificarPermiso(PUEDEN_RESERVAR),
    async (req, res) => {
        const { laboratorio_id, fecha, hora_inicio, hora_fin } = req.query;
        try {
            // Solape estándar: existing.start < new.end AND existing.end > new.start
            const result = await pool.query(
                `SELECT 1 FROM reservaciones
                  WHERE laboratorio_id = $1 AND fecha = $2 AND estado = 'activa'
                    AND hora_inicio < $4 AND hora_fin > $3
                  LIMIT 1`,
                [laboratorio_id, fecha, hora_inicio, hora_fin]
            );
            res.json({ success: true, disponible: result.rows.length === 0 });
        } catch (error) {
            console.error('[disponibilidad]', error);
            res.status(500).json({ success: false, message: 'No se pudo verificar la disponibilidad.' });
        }
    }
);


router.get('/',
    verificarPermiso(PUEDEN_VER_TODAS),
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
            console.error('[reservaciones list]', error);
            res.status(500).json({ success: false, message: 'No se pudieron obtener las reservaciones.' });
        }
    }
);


router.post('/',
    verificarPermiso(PUEDEN_RESERVAR),
    upload.single('lista_estudiantes'),
    async (req, res) => {
        const { laboratorio_id, fecha, hora_inicio, hora_fin, practice_type, materials, num_students } = req.body;

        // El docente solo puede reservar para sí mismo. Admin/jefe pueden actuar a nombre de un docente.
        const usuario_id = esGestor(req.usuario.rol_id)
            ? Number(req.body.usuario_id ?? req.usuario.id)
            : req.usuario.id;

        if (!Number.isInteger(usuario_id)) {
            return res.status(400).json({ success: false, message: 'usuario_id inválido.' });
        }

        const client = await pool.connect();
        let uploadedFileName = null;
        try {
            await client.query('BEGIN');

            // 1. Verificar disponibilidad PRIMERO (con FOR UPDATE para evitar race conditions).
            const checkResult = await client.query(
                `SELECT 1 FROM reservaciones
                  WHERE laboratorio_id = $1 AND fecha = $2 AND estado = 'activa'
                    AND hora_inicio < $4 AND hora_fin > $3
                  FOR UPDATE`,
                [laboratorio_id, fecha, hora_inicio, hora_fin]
            );

            if (checkResult.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    success: false,
                    message: 'Lo sentimos, este horario ya no está disponible. Alguien más acaba de reservarlo.',
                });
            }

            // 2. Subir archivo SOLO después de validar disponibilidad para no dejar huérfanos.
            let studentListUrl = null;
            if (req.file) {
                const fileName = `${crypto.randomUUID()}${path.extname(req.file.originalname).toLowerCase()}`;
                const { error: uploadError } = await supabase.storage
                    .from('estudiantes')
                    .upload(fileName, req.file.buffer, {
                        contentType: req.file.mimetype,
                        upsert: false,
                    });

                if (uploadError) throw uploadError;

                uploadedFileName = fileName;
                const { data: { publicUrl } } = supabase.storage
                    .from('estudiantes')
                    .getPublicUrl(fileName);
                studentListUrl = publicUrl;
            }

            // 3. Insertar
            const result = await client.query(
                `INSERT INTO reservaciones (laboratorio_id, usuario_id, fecha, hora_inicio, hora_fin, practice_type, materials, num_students, lista_estudiantes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [laboratorio_id, usuario_id, fecha, hora_inicio, hora_fin, practice_type, materials, num_students || null, studentListUrl]
            );

            await client.query('COMMIT');
            res.json({ success: true, reservacion: result.rows[0] });
        } catch (error) {
            await client.query('ROLLBACK');
            // Si el archivo se subió pero el INSERT falló, lo borramos del bucket.
            if (uploadedFileName) {
                try {
                    await supabase.storage.from('estudiantes').remove([uploadedFileName]);
                } catch (cleanupErr) {
                    console.error('[reservaciones cleanup]', cleanupErr);
                }
            }
            console.error('[reservaciones create]', error);
            res.status(500).json({ success: false, message: 'No se pudo crear la reservación.' });
        } finally {
            client.release();
        }
    }
);


router.put('/:id/cancelar',
    verificarPermiso(PUEDEN_CANCELAR),
    async (req, res) => {
        // cancelada_por SIEMPRE viene del token, nunca del body (auditoría real).
        const cancelada_por = req.usuario.id;
        try {
            const result = await pool.query(
                `UPDATE reservaciones
                    SET estado = 'cancelada', cancelada_por = $1
                  WHERE id = $2 AND estado = 'activa'
                  RETURNING *`,
                [cancelada_por, req.params.id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Reservación no encontrada o ya cancelada.' });
            }
            res.json({ success: true, reservacion: result.rows[0] });
        } catch (error) {
            console.error('[reservaciones cancel]', error);
            res.status(500).json({ success: false, message: 'No se pudo cancelar la reservación.' });
        }
    }
);



module.exports = router;