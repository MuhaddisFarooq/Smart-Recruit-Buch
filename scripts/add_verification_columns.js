require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        console.log('Connected to database.');

        // Add verification_code column
        try {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN verification_code VARCHAR(10) DEFAULT NULL,
                ADD COLUMN verification_expires DATETIME DEFAULT NULL
            `);
            console.log('Added verification columns.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Verification columns already exist.');
            } else {
                throw err;
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

main();
