import { execute } from "../src/lib/db";

async function main() {
    try {
        console.log("Checking if attachments column exists in jobs table...");
        try {
            await execute("ALTER TABLE jobs ADD COLUMN attachments TEXT");
            console.log("Added attachments column to jobs table.");
        } catch (error: any) {
            if (error.message && error.message.includes("Duplicate column name")) {
                console.log("attachments column already exists.");
            } else {
                console.error("Error checking/adding column:", error);
            }
        }

        console.log("Migration complete.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();
