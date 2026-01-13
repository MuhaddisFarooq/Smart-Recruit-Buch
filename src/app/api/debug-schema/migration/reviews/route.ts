
import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";

export async function GET() {
    try {
        await execute(`
            CREATE TABLE IF NOT EXISTS candidate_reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                reviewer_id INT,
                rating INT NOT NULL,
                review_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        return NextResponse.json({ message: "Created candidate_reviews table" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
