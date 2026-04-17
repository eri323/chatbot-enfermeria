const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addPolicy() {
    try {
        console.log('Adding SELECT policy for anonymous users on "reservaciones" table...');
        
        // Habilitar SELECT para el rol 'anon'
        // Esto es necesario para que Realtime pueda emitir los cambios al frontend
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = 'reservaciones' AND policyname = 'Allow public select for realtime'
                ) THEN
                    CREATE POLICY "Allow public select for realtime" ON "public"."reservaciones"
                    FOR SELECT
                    TO anon
                    USING (true);
                END IF;
            END $$;
        `);
        
        console.log('✅ Policy added successfully!');
        
        // También asegurarnos de que el rol anon tenga permisos de uso sobre el esquema
        // Generalmente ya lo tiene en Supabase, pero por si acaso.
        await pool.query('GRANT SELECT ON TABLE public.reservaciones TO anon;');
        await pool.query('GRANT SELECT ON TABLE public.reservaciones TO authenticated;');
        
        console.log('✅ Permissions granted successfully!');

    } catch (err) {
        console.error('❌ Error adding policy:', err.message);
    } finally {
        await pool.end();
    }
}

addPolicy();
