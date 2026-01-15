
const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env" });

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [rows] = await pool.execute("DESCRIBE job_applications");
        console.log(rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

run();
