
import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await execute(`
            ALTER TABLE job_applications 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL,
            ADD COLUMN IF NOT EXISTS user_id INT,
            ADD COLUMN IF NOT EXISTS notes TEXT,
            ADD COLUMN IF NOT EXISTS applied_date DATETIME DEFAULT CURRENT_TIMESTAMP;
        `, []);

        return NextResponse.json({ success: true, message: "Schema updated: Added email and other potential missing cols" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
