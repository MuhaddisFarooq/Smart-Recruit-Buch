import 'dotenv/config';
import { execute } from "../src/lib/db";

async function main() {
    console.log("⚠️  Starting Database Cleanup...");
    console.log("This will delete ALL users and hiring team entries.");

    try {
        // Disable Foreign Key Checks to allow truncation
        await execute("SET FOREIGN_KEY_CHECKS = 0");

        // Truncate tables to remove all data and reset IDs
        console.log("Cleaning 'job_hiring_team' table...");
        await execute("TRUNCATE TABLE job_hiring_team");

        console.log("Cleaning 'users' table...");
        await execute("TRUNCATE TABLE users");

        // Re-enable Foreign Key Checks
        await execute("SET FOREIGN_KEY_CHECKS = 1");

        console.log("✅ Database cleanup complete! All users and hiring teams removed.");
    } catch (error) {
        console.error("❌ Error cleaning database:", error);
    }
    process.exit(0);
}

main();
