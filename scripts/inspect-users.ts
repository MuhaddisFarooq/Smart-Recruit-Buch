
import { query } from "@/lib/db";

async function main() {
    try {
        console.log("Fetching users named 'Muhaddis Farooq'...");
        const users = await query(`
            SELECT id, name, email, designation 
            FROM users 
            WHERE name LIKE '%Muhaddis Farooq%'
        `) as any[];

        console.log(`Found ${users.length} users.`);

        for (const u of users) {
            console.log(`\nUser ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Designation: ${u.designation}`);

            const exp = await query(`
                SELECT id, title, company, is_current, start_date 
                FROM candidate_experience 
                WHERE user_id = ? 
                ORDER BY is_current DESC, start_date DESC
             `, [u.id]) as any[];

            console.log(`  Experience Count: ${exp.length}`);
            exp.forEach(e => {
                console.log(`    - ${e.title} at ${e.company} (Current: ${e.is_current})`);
            });
        }

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

main();
