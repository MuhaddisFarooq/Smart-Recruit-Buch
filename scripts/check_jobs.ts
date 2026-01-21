
import 'dotenv/config';
import { query } from "../src/lib/db";

async function main() {
    try {
        // Check recent jobs
        const jobs = await query("SELECT id, job_title, department, addedDate FROM jobs ORDER BY id DESC LIMIT 5");
        console.log("Recent jobs:", JSON.stringify(jobs, null, 2));

    } catch (e) {
        console.error(e);
    }
}
main();
