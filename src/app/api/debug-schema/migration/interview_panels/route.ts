
import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        await execute(`
            CREATE TABLE IF NOT EXISTS interview_panels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                user_id INT NOT NULL,
                role VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        return NextResponse.json({ message: "Migration successful" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
