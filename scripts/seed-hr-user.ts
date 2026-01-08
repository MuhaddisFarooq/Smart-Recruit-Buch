import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function seedHR() {
    console.log("Connecting to database...");
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const email = "hr@example.com"; // Default HR email
        const textPassword = "password123";
        const hashedPassword = await bcrypt.hash(textPassword, 10);
        const role = "HR";
        const name = "HR Manager";
        const status = "active";

        console.log(`seeding user: ${email} with role: ${role}`);

        const query = `
            INSERT INTO users (email, password, role, name, status, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;

        await connection.execute(query, [email, hashedPassword, role, name, status]);
        console.log("HR User created successfully!");
        console.log("Email:", email);
        console.log("Password:", textPassword);

    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log("User already exists!");
        } else {
            console.error("Error seeding user:", error);
        }
    } finally {
        await connection.end();
    }
}

seedHR();
