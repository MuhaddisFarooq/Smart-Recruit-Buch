import { execute } from "../src/lib/db";

async function main() {
    try {
        console.log("Creating job_hiring_team table...");

        await execute(`
            CREATE TABLE IF NOT EXISTS job_hiring_team (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NOT NULL,
                user_id INT NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_team_member (job_id, user_id)
            )
        `);

        console.log("job_hiring_team table created.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();
