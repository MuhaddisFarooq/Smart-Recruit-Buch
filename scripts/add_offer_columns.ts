
import 'dotenv/config';
import { execute, query } from "@/lib/db";

async function migrate() {
    try {
        console.log("Checking columns...");
        const cols = await query("SHOW COLUMNS FROM job_applications");
        const colNames = cols.map((c: any) => c.Field);

        if (!colNames.includes("offer_letter_url")) {
            console.log("Adding offer_letter_url...");
            await execute("ALTER TABLE job_applications ADD COLUMN offer_letter_url VARCHAR(500) DEFAULT NULL");
        } else {
            console.log("offer_letter_url exists.");
        }

        if (!colNames.includes("signed_offer_letter_url")) {
            console.log("Adding signed_offer_letter_url...");
            await execute("ALTER TABLE job_applications ADD COLUMN signed_offer_letter_url VARCHAR(500) DEFAULT NULL");
        } else {
            console.log("signed_offer_letter_url exists.");
        }

        console.log("Migration complete.");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

migrate();
