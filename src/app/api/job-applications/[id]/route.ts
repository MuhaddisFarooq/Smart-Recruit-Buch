import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

// PATCH /api/job-applications/[id] - Update application status
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        // Validate status enum
        const validStatuses = ['new', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        await execute(
            "UPDATE job_applications SET status = ? WHERE id = ?",
            [status, id]
        );

        return NextResponse.json({ success: true, message: "Application updated successfully" });
    } catch (error: any) {
        console.error("Error updating application:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/job-applications/[id] - Delete an application
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify it exists first
        const existing = await query("SELECT id FROM job_applications WHERE id = ?", [id]);
        if (!Array.isArray(existing) || existing.length === 0) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        await execute("DELETE FROM job_applications WHERE id = ?", [id]);

        return NextResponse.json({ success: true, message: "Application deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting application:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
