import 'dotenv/config';
import { query } from "../src/lib/db";

async function main() {
    const fs = require('fs');
    let output = "--- Debugging Job 24 Team ---\n";
    const team = await query(`
        SELECT t.job_id, t.user_id, t.role, u.id as u_id, u.name, u.email, u.emp_id 
        FROM job_hiring_team t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.job_id = 24
    `);
    output += JSON.stringify(team, null, 2) + "\n\n";

    output += "--- Checking User 'Muhammad Asim' ---\n";
    const usersByName = await query(`SELECT * FROM users WHERE name LIKE '%Muhammad Asim%'`);
    output += JSON.stringify(usersByName, null, 2) + "\n\n";

    output += "--- Checking User by Emp ID 100094 ---\n";
    const usersByEmpId = await query(`SELECT * FROM users WHERE emp_id = '100094'`);
    output += JSON.stringify(usersByEmpId, null, 2) + "\n\n";

    output += "--- Checking User by Email ---\n";
    const usersByEmail = await query(`SELECT * FROM users WHERE email = 'muhammadasim@buchhospital.com'`);
    output += JSON.stringify(usersByEmail, null, 2) + "\n\n";

    fs.writeFileSync('debug_output.txt', output);
    console.log("Debug output written to debug_output.txt");

    process.exit(0);
}

main();
