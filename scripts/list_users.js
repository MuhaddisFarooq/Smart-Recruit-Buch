
require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function main() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306')
        });

        const [rows] = await connection.execute(
            'SELECT id, email, name, role, status FROM users LIMIT 10'
        );

        console.log('--- Current Users in DB ---');
        console.table(rows);

        await connection.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
