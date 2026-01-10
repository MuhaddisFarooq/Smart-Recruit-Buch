import { query } from "../src/lib/db";

async function debugJobData(jobId: string) {
    console.log(`--- Debugging Job ID: ${jobId} ---`);

    // 1. Check Job Status
    const jobs = await query("SELECT id, status FROM jobs WHERE id = ?", [jobId]);
    console.log("Job Data:", JSON.stringify(jobs, null, 2));

    // 2. Check Applications Count
    const counts = await query("SELECT status, COUNT(*) as c FROM job_applications WHERE job_id = ? GROUP BY status", [jobId]);
    console.log("Application Counts:", JSON.stringify(counts, null, 2));

    // 3. Check Applications List (Simple)
    const appsSimple = await query("SELECT id, user_id, status FROM job_applications WHERE job_id = ?", [jobId]);
    console.log("Applications Raw IDs:", JSON.stringify(appsSimple, null, 2));

    // 4. Test the Complex Query (Simulated)
    try {
        const appsComplex = await query(`
            SELECT 
                ja.id
            FROM job_applications ja
            LEFT JOIN users u ON ja.user_id = u.id
            WHERE ja.job_id = ?
        `, [jobId]);
        console.log("Complex Query Row Count:", Array.isArray(appsComplex) ? appsComplex.length : "Not Array");
    } catch (e: any) {
        console.error("Complex Query Failed:", e.message);
    }
}

// Get ID from arg or default to 3 based on screenshot
const id = process.argv[2] || "3";
debugJobData(id).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
