
import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";

export async function GET() {
    try {
        // Check if column exists
        const columns = await query("SHOW COLUMNS FROM job_applications LIKE 'score'");
        if (columns.length === 0) {
            await execute("ALTER TABLE job_applications ADD COLUMN score DECIMAL(4,2) DEFAULT 0");
            return NextResponse.json({ message: "Added score column" });
        }
        return NextResponse.json({ message: "Score column already exists" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
