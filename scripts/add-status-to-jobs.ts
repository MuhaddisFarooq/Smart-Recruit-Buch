import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const configBase = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3309,
    user: process.env.DB_USER || "muhaddis",
    password: process.env.DB_PASSWORD, // This might be empty for root based on previous context, but usually let's try reading from env or fallback
    database: "smart-recruit"
};

// Based on previous successful connections, it seems we might need specific credentials if env fails
// But let's try standard approach first, or the "root" with empty password if checking .env failed previously.
// Actually, earlier successfully used: user: "root", password: "" or user: "muhaddis", password: "admin123@"

async function addStatusColumn() {
    console.log("Connecting to database...");
    let connection;
    try {
        connection = await mysql.createConnection(configBase);
    } catch (e) {
        // Fallback based on learnings
        console.log("Env connect failed, trying fallback...");
        connection = await mysql.createConnection({
            host: "127.0.0.1",
            port: 3309,
            user: "root",
            password: "",
            database: "smart-recruit"
        });
    }

    try {
        console.log("Adding status column to jobs table...");
        const query = `
            ALTER TABLE jobs
            ADD COLUMN status ENUM('Active', 'Inactive') DEFAULT 'Active' AFTER job_title;
        `;
        await connection.query(query);
        console.log("Column 'status' added successfully!");
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'status' already exists.");
        } else {
            console.error("Error adding column:", e.message);
        }
    } finally {
        await connection.end();
    }
}

addStatusColumn();
