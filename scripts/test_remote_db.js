const mysql = require('mysql2/promise');

async function main() {
    console.log('Testing connection to remote Website DB...');
    const pool = mysql.createPool({
        host: "srv1612.hstgr.io",
        user: "u335052771_buchwebsite",
        password: "n@sDA4?5S",
        database: "u335052771_buchwebsite",
        port: 3306,
        connectTimeout: 5000
    });

    try {
        const [rows] = await pool.query("SELECT 1 as val");
        console.log("Connection SUCCESS:", rows);

        // Also check careers table structure if possible
        try {
            const [cols] = await pool.query("SHOW COLUMNS FROM careers");
            console.log("Careers Table Columns:", cols.map(c => c.Field));
        } catch (e) {
            console.error("Could not read careers columns:", e.message);
        }

    } catch (error) {
        console.error('Connection FAILED:', error.message);
    } finally {
        await pool.end();
    }
}

main();
