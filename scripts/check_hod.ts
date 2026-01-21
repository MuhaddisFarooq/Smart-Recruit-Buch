
import 'dotenv/config';
import { query } from "../src/lib/db";

async function main() {
    try {
        // Check if HOD exists in users table
        // The department API says ICT's HOD is "100007"
        const hodId = "100007";

        console.log("Looking for HOD with emp_id:", hodId);

        const users = await query(
            "SELECT id, email, name, emp_id, employee_id, department FROM users WHERE emp_id = ? OR employee_id = ? OR id = ?",
            [hodId, hodId, hodId]
        );

        console.log("Found users:", JSON.stringify(users, null, 2));

        // Also check what's in job_hiring_team
        const hiringTeam = await query("SELECT * FROM job_hiring_team LIMIT 10");
        console.log("Hiring team entries:", JSON.stringify(hiringTeam, null, 2));

    } catch (e) {
        console.error(e);
    }
}
main();
