
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { execute, query } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { new_job_id } = body;

        if (!new_job_id) return NextResponse.json({ error: "New Job ID required" }, { status: 400 });

        // Update the job_id for the application
        await execute(
            "UPDATE job_applications SET job_id = ?, updated_at = NOW() WHERE id = ?",
            [new_job_id, id]
        );

        // Fetch new job info for response/notifications
        const jobRows = await query("SELECT job_title FROM jobs WHERE id = ?", [new_job_id]);
        const jobTitle = jobRows.length > 0 ? jobRows[0].job_title : "Unknown Job";

        return NextResponse.json({ success: true, message: `Moved to ${jobTitle}` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
