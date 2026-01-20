
import 'dotenv/config';
import { query } from "../src/lib/db";

async function main() {
    try {
        const user = await query("SELECT id, email, role, status FROM users WHERE email = 'muhaddisfarooq22@gmail.com'");
        console.log("User Data:", JSON.stringify(user, null, 2));
    } catch (e) {
        console.error(e);
    }
}
main();
