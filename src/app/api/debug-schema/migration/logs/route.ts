
import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export async function GET() {
    try {
        await execute(`
            CREATE TABLE IF NOT EXISTS application_status_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                application_id INT NOT NULL,
                previous_status VARCHAR(50),
                new_status VARCHAR(50) NOT NULL,
                changed_by_user_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
                FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
            )
        `);
        return NextResponse.json({ message: "Created application_status_logs table" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
