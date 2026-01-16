const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'd:/smart-recruiter/portal/.env' });

async function run() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
        });

        console.log("Connected to DB");

        try {
            await connection.execute("ALTER TABLE jobs ADD COLUMN advertised_date DATETIME NULL");
            console.log("Column advertised_date added");
        } catch (e) {
            console.log("Column might already exist or error:", e.message);
        }

        await connection.end();
    } catch (e) {
        console.error(e);
    }
}

run();
