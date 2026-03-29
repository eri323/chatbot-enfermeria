const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

const verificarPermiso = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuario no autenticado.' });
        }

        
        const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];

        if (!roles.includes(req.usuario.rol_id)) {
            return res.status(403).json({ 
                error: `Acceso denegado. Rol requerido: ${roles.join(', ')}`,
                tu_rol: req.usuario.rol_nombre
            });
        }

        next();
    };
};

module.exports = { verificarToken, verificarPermiso };