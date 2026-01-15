
const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env" });

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const currentUserId = "14";

    console.log("Testing with User ID:", currentUserId);

    try {
        const [user] = await pool.execute("SELECT * FROM users WHERE id = ?", [15]);
        console.log("User 15:", user);
    } catch (err) {
        console.error("Error fetching user 15:", err);
    }

    try {
        const [rows] = await pool.execute(
            `SELECT 
            CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END as other_user_id,
            MAX(m.created_at) as last_message_at
            FROM messages m
            WHERE m.sender_id = ? OR m.receiver_id = ?
            GROUP BY other_user_id
            ORDER BY last_message_at DESC`,
            [currentUserId, currentUserId, currentUserId]
        );
        console.log("Rows:", rows);
    } catch (err) {
        console.error("Error fetching messages:", err);
    } finally {
        await pool.end();
    }
}

run();
