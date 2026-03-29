const pool = require('./db.js');
async function run() {
    try {
        const res = await pool.query("SELECT * FROM roles");
        console.log(res.rows);
    } catch (e) {
        console.error(e.message);
    }
    process.exit(0);
}
run();
