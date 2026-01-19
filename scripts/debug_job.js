const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [rows] = await pool.query("SELECT * FROM jobs ORDER BY id DESC LIMIT 1");
        console.log("Latest Job:", rows[0]);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

main();
