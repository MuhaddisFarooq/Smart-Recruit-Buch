import 'dotenv/config';
import { execute, query } from "../src/lib/db";

async function migrate() {
    try {
        console.log("Checking columns in jobs table...");
        const columns = await query("SHOW COLUMNS FROM jobs");

        const hasDepartmentId = (columns as any[]).some(col => col.Field === 'department_id');
        const hasHodId = (columns as any[]).some(col => col.Field === 'hod_id');

        if (!hasDepartmentId) {
            console.log("Adding department_id column...");
            await execute("ALTER TABLE jobs ADD COLUMN department_id VARCHAR(50) NULL AFTER department");
        } else {
            console.log("department_id already exists.");
        }

        if (!hasHodId) {
            console.log("Adding hod_id column...");
            await execute("ALTER TABLE jobs ADD COLUMN hod_id VARCHAR(50) NULL AFTER department_id");
        } else {
            console.log("hod_id already exists.");
        }

        console.log("Migration complete.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
