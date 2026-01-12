import { execute } from "../src/lib/db";

async function main() {
    try {
        const users = await execute("DESCRIBE users");
        console.log("Users Table:", users);
    } catch (e) {
        console.log("Error describing users:", e);
    }
}

main();
