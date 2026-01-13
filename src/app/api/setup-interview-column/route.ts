
import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";

export async function GET() {
    try {
        // Check if column exists
        const check = await query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'smart_recruiter' 
            AND TABLE_NAME = 'job_applications' 
            AND COLUMN_NAME = 'interview_date'
        `);

        if (check.length === 0) {
            await execute(`
                ALTER TABLE job_applications 
                ADD COLUMN interview_date DATETIME NULL
            `);
            return NextResponse.json({ message: "Added interview_date column" });
        } else {
            return NextResponse.json({ message: "Column interview_date already exists" });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
