
import 'dotenv/config';
import { execute, query } from "../src/lib/db";

async function main() {
    try {
        // First check what we have for job 16
        const current = await query("SELECT jht.*, u.role as user_role FROM job_hiring_team jht JOIN users u ON jht.user_id = u.id WHERE jht.job_id = 16");
        console.log("Current team for job 16:", JSON.stringify(current, null, 2));

        // Update role to HOD for job 16
        const result = await execute(
            "UPDATE job_hiring_team SET role = 'HOD' WHERE job_id = 16"
        );
        console.log("Updated:", result);

    } catch (e) {
        console.error(e);
    }
}
main();
