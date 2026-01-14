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
        const { applicationId, newJobId } = body;

        if (!applicationId || !newJobId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get Source Application Details
        const apps = await query("SELECT * FROM job_applications WHERE id = ?", [applicationId]);
        if (apps.length === 0) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }
        const sourceApp = apps[0];

        // 2. Check if User already applied to New Job
        const existing = await query(
            "SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?",
            [newJobId, sourceApp.user_id]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "Candidate is already applied to this job" }, { status: 400 });
        }

        // 3. Create New Application (Copy relevant data)
        // We can keep the same score, resume, etc. or reset them.
        // Usually moving implies keeping the candidate profile but restarting the process?
        // User said: "add him to other job ... removed from this job"
        // Let's copy basic info. Status usually resets to 'new' or 'reviewed' for a new job.
        // Let's set status to 'new' for the new job.

        await execute(
            `INSERT INTO job_applications 
            (job_id, user_id, status, resume_path, resume_url, cover_letter, applied_at)
            VALUES (?, ?, 'new', ?, ?, ?, NOW())`,
            [newJobId, sourceApp.user_id, sourceApp.resume_path, sourceApp.resume_url, sourceApp.cover_letter]
        );

        // 4. Delete Source Application
        await execute("DELETE FROM job_applications WHERE id = ?", [applicationId]);

        // 5. Log Activity (Optional but good practice)
        // TODO: Logging

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Move error:", error);
        return NextResponse.json({ error: error.message || "Failed to move application" }, { status: 500 });
    }
}
