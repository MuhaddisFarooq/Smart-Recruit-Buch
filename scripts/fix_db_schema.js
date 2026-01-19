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
        // 1. Add emp_id
        try {
            await pool.query("ALTER TABLE users ADD COLUMN emp_id VARCHAR(50) DEFAULT NULL AFTER id");
            console.log("Added emp_id column.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("emp_id column already exists.");
            } else {
                console.error("Error adding emp_id:", e.message);
            }
        }

        // 2. Ensure department/designation exist (just in case)
        const [cols] = await pool.query("SHOW COLUMNS FROM users");
        const colNames = cols.map(c => c.Field);

        if (!colNames.includes('department')) {
            await pool.query("ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT NULL");
            console.log("Added department column.");
        }
        if (!colNames.includes('designation')) {
            await pool.query("ALTER TABLE users ADD COLUMN designation VARCHAR(100) DEFAULT NULL");
            console.log("Added designation column.");
        }

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await pool.end();
    }
}

main();
