import { execute } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await execute(`
            CREATE TABLE IF NOT EXISTS candidate_experience (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                location VARCHAR(255),
                description TEXT,
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                KEY (user_id)
            )
        `);

        await execute(`
            CREATE TABLE IF NOT EXISTS candidate_education (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                institution VARCHAR(255) NOT NULL,
                degree VARCHAR(255),
                major VARCHAR(255),
                location VARCHAR(255),
                description TEXT,
                start_date DATE,
                end_date DATE,
                is_current BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                KEY (user_id)
            )
        `);

        return NextResponse.json({ success: true, message: "Experience and Education tables created" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
