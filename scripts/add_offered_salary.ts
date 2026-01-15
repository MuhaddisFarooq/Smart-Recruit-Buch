
import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        console.log("Adding offered_salary column...");
        await connection.query(`
            ALTER TABLE job_applications
            ADD COLUMN offered_salary VARCHAR(255) NULL AFTER score;
        `);
        console.log("Column added successfully.");
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.error("Error:", error);
        }
    } finally {
        await connection.end();
    }
}

run();
