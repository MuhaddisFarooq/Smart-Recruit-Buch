const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log('Connecting to DB...', process.env.DB_NAME);
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [cols] = await pool.query("SHOW COLUMNS FROM jobs");
        const colNames = cols.map(c => c.Field);

        if (!colNames.includes('advertised_date')) {
            await pool.query("ALTER TABLE jobs ADD COLUMN advertised_date DATETIME DEFAULT NULL");
            console.log("Added advertised_date column.");
        } else {
            console.log("advertised_date column already exists.");
        }

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await pool.end();
    }
}

main();
