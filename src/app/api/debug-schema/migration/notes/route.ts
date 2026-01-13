
import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";

export async function GET() {
    try {
        await execute(`
            CREATE TABLE IF NOT EXISTS candidate_notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                author_id INT,
                note_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        return NextResponse.json({ message: "Created candidate_notes table" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
