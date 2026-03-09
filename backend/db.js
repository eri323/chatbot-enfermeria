const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(() => console.log('✅ Conectado a PostgreSQL - Supabase'))
    .catch(err => console.error('❌ Error de conexión:', err.message));

module.exports = pool;