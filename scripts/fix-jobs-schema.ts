import { execute } from "../src/lib/db";

async function main() {
    try {
        console.log("Checking and adding missing columns to jobs table...");

        const columnsToAdd = [
            { name: "internal_notes", type: "TEXT" },
            { name: "target_hiring_date", type: "DATE" },
            { name: "attachments", type: "TEXT" } // ensuring this is here too
        ];

        for (const col of columnsToAdd) {
            try {
                await execute(`ALTER TABLE jobs ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added ${col.name} column.`);
            } catch (error: any) {
                if (error.message && error.message.includes("Duplicate column name")) {
                    console.log(`${col.name} column already exists.`);
                } else {
                    console.error(`Error adding ${col.name}:`, error);
                }
            }
        }

        console.log("Migration complete.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();
