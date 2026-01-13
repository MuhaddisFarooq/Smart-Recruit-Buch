
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { user_id, job_id } = body;

        if (!user_id || !job_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if application already exists for this job
        const existing = await query("SELECT id FROM job_applications WHERE user_id = ? AND job_id = ?", [user_id, job_id]);
        if (existing.length > 0) {
            return NextResponse.json({ error: "Candidate already applied to this job" }, { status: 400 });
        }

        // Create new application
        await execute(`
            INSERT INTO job_applications (user_id, job_id, status, applied_at)
            VALUES (?, ?, 'new', NOW())
        `, [user_id, job_id]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error adding candidate to job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
