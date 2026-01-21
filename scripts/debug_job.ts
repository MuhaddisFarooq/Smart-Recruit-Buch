
import 'dotenv/config';
import { query } from "../src/lib/db";

async function main() {
    try {
        // Check job 16 details
        const job = await query("SELECT id, job_title, department, department_id, hod_id FROM jobs WHERE id = 16");
        console.log("Job 16:", JSON.stringify(job, null, 2));

        // Check hiring team for job 16
        const hiringTeam = await query(`
            SELECT jht.*, u.name, u.email 
            FROM job_hiring_team jht 
            LEFT JOIN users u ON jht.user_id = u.id 
            WHERE jht.job_id = 16
        `);
        console.log("Hiring team for job 16:", JSON.stringify(hiringTeam, null, 2));

        // Check if HOD user exists
        const hodUser = await query("SELECT id, name, email, emp_id, role FROM users WHERE emp_id = '100007' OR role = 'hod'");
        console.log("HOD users:", JSON.stringify(hodUser, null, 2));

    } catch (e) {
        console.error(e);
    }
}
main();
