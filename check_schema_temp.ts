
import { query, pool } from "./src/lib/db";

async function checkSchema() {
    try {
        console.log("--- Users Table ---");
        const usersCols = await query("SHOW COLUMNS FROM users");
        usersCols.forEach((col: any) => console.log(col.Field));

        console.log("\n--- Jobs Table ---");
        const jobsCols = await query("SHOW COLUMNS FROM jobs");
        jobsCols.forEach((col: any) => console.log(col.Field));

        console.log("\n--- Job Applications Table ---");
        const appCols = await query("SHOW COLUMNS FROM job_applications");
        appCols.forEach((col: any) => console.log(col.Field));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkSchema();
