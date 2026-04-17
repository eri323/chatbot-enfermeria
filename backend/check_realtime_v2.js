const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkRealtime() {
    try {
        console.log('Checking publication "supabase_realtime" for table "reservaciones"...');
        const resPub = await pool.query(`
            SELECT * FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reservaciones';
        `);
        
        if (resPub.rows.length > 0) {
            console.log('✅ Realtime IS ENABLED for "reservaciones".');
        } else {
            console.log('❌ Realtime IS DISABLED for "reservaciones".');
        }

        console.log('Checking Row Level Security (RLS)...');
        const resRls = await pool.query(`
            SELECT relrowsecurity FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relname = 'reservaciones';
        `);
        
        const isRlsEnabled = resRls.rows[0]?.relrowsecurity;
        console.log('RLS status:', isRlsEnabled ? 'ENABLED' : 'DISABLED');

        if (isRlsEnabled) {
            console.log('Checking for SELECT policies for "anon" role...');
            const resPol = await pool.query(`
                SELECT * FROM pg_policies 
                WHERE tablename = 'reservaciones' AND cmd = 'SELECT';
            `);
            console.log(`Found ${resPol.rows.length} SELECT policies.`);
            resPol.rows.forEach(p => console.log(` - Policy: ${p.policyname}, Roles: ${p.roles}`));
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkRealtime();
