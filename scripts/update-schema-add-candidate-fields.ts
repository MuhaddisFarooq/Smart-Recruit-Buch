import { execute } from "../src/lib/db";

async function updateSchema() {
    console.log("Updating job_applications schema...");

    try {
        // Add 'source' column
        await execute(`
            ALTER TABLE job_applications 
            ADD COLUMN source VARCHAR(100) DEFAULT NULL,
            ADD COLUMN source_type VARCHAR(50) DEFAULT NULL,
            ADD COLUMN tags TEXT DEFAULT NULL;
        `, []);
        console.log("✅ Added source, source_type, and tags columns.");
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("⚠️ Columns likely already exist.");
        } else {
            console.error("Error adding columns:", e);
        }
    }
}

updateSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
