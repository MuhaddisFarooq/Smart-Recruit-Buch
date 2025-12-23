
import { config as loadEnv } from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import fs from "fs";

// Load env
const root = process.cwd();
loadEnv({ path: path.join(root, ".env.local") });
loadEnv({ path: path.join(root, ".env") });

async function main() {
    const logFile = path.join(root, "debug-output.txt");
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + "\n");
    };
    fs.writeFileSync(logFile, ""); // clear

    const { DB_HOST, DB_PORT, DB_USER, DB_NAME } = process.env;
    log(
        `Connecting to mysql://${DB_USER ?? "(unset)"}@${DB_HOST ?? "127.0.0.1"}:${DB_PORT ?? "3306"}/${DB_NAME ?? "(unset)"}`
    );

    try {
        const { query, pool } = await import("../src/lib/db");

        // 1. Check if users table exists and list users (limit 5)
        log("Checking users table...");
        const users = await query("SELECT id, email, role, status, password FROM users LIMIT 5");
        log(`Found ${users.length} users:`);

        for (const u of users) {
            log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Status: ${u.status}`);
            // Test password 'admin123!' and 'superadmin123!' against hash just in case
            const isSuper = await bcrypt.compare("superadmin123!", u.password);
            const isAdmin = await bcrypt.compare("admin123!", u.password);
            log(`  Matches 'superadmin123!': ${isSuper}`);
            log(`  Matches 'admin123!': ${isAdmin}`);
        }

        if (users.length === 0) {
            log("No users found in database!");
        }

        await pool.end();

    } catch (error) {
        log("Error querying database: " + JSON.stringify(error, null, 2));
        console.error("Error querying database:", error);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
