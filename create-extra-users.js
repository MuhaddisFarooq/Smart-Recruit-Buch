
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
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
        const passwordHash = await bcrypt.hash("123456", 10);

        // 1. HR Manager
        const [hrRows] = await pool.execute("SELECT id FROM users WHERE email = ?", ["muhaddisfarooq9999@gmail.com"]);
        if (hrRows.length === 0) {
            await pool.execute(
                "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
                ["Muhaddis Farooq (HR)", "muhaddisfarooq9999@gmail.com", passwordHash, "HR Manager", "active"]
            );
            console.log("Created HR Manager: muhaddisfarooq9999@gmail.com");
        } else {
            console.log("HR Manager already exists");
        }

        // 2. Superadmin
        const [saRows] = await pool.execute("SELECT id FROM users WHERE email = ?", ["muhaddisfarooq22@gmail.com"]);
        if (saRows.length === 0) {
            await pool.execute(
                "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
                ["Muhaddis Farooq (SuperAdmin)", "muhaddisfarooq22@gmail.com", passwordHash, "superadmin", "active"]
            );
            console.log("Created Superadmin: muhaddisfarooq22@gmail.com");
        } else {
            // Update role if exists but not superadmin? Just logging for now.
            console.log("Superadmin user already exists");
            await pool.execute("UPDATE users SET role = 'superadmin' WHERE email = ?", ["muhaddisfarooq22@gmail.com"]);
            console.log("Updated role to superadmin for muhaddisfarooq22@gmail.com");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

run();
