import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: '.env.local' });

async function main() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        console.log('Checking for emp_id column in users table...');
        const [columns] = await pool.query<any[]>(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'emp_id'
    `, [process.env.DB_NAME]);

        if (columns.length === 0) {
            console.log('Adding emp_id column...');
            await pool.query(`ALTER TABLE users ADD COLUMN emp_id VARCHAR(50) DEFAULT NULL AFTER id`);
            console.log('emp_id column added successfully.');
        } else {
            console.log('emp_id column already exists.');
        }

    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await pool.end();
    }
}

main();
