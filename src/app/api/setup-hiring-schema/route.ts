import { NextResponse } from "next/server";
import { execute } from "../../../lib/db";

export async function GET() {
    try {
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
        return NextResponse.json({ success: true, message: "job_hiring_team table created" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
