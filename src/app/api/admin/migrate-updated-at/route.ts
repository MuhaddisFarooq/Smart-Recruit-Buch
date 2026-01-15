
import { execute } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await execute(`
            ALTER TABLE job_applications
            ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
        `);
        return NextResponse.json({ success: true, message: "Migration executed" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
