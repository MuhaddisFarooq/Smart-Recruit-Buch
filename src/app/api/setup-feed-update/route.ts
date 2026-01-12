
import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export async function GET() {
    try {
        await execute(`
            ALTER TABLE job_applications 
            ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `);
        return NextResponse.json({ message: "Column updated_at added successfully" });
    } catch (error: any) {
        // Ignore if exists (error 1060)
        return NextResponse.json({ result: error.message });
    }
}
