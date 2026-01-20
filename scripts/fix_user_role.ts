
import 'dotenv/config';
import { execute } from "../src/lib/db";

async function main() {
    try {
        const result = await execute(
            "UPDATE users SET role = 'candidate' WHERE email = 'muhaddisfarooq22@gmail.com'"
        );
        console.log("Update Result:", result);
    } catch (e) {
        console.error(e);
    }
}
main();
