
import { query } from "../src/lib/db";

async function checkJobStatus() {
    try {
        const rows = await query("SELECT id, title, status FROM jobs WHERE id = 2", []);
        console.log("Job Status:", rows);
    } catch (e) {
        console.error(e);
    }
}

checkJobStatus().then(() => process.exit(0));
