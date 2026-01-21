
import 'dotenv/config';
import { execute } from "../src/lib/db";

async function main() {
    try {
        // Update existing Hiring Manager entries for HODs to role = 'HOD'
        // This fixes entries created before the role was updated
        const result = await execute(
            "UPDATE job_hiring_team SET role = 'HOD' WHERE role = 'Hiring Manager' AND user_id IN (SELECT id FROM users WHERE role = 'hod')"
        );
        console.log("Updated HOD roles:", result);

    } catch (e) {
        console.error(e);
    }
}
main();
