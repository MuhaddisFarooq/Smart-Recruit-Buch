
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { execute, query } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params; // This is USER ID, not application ID if we call this /api/people/[id]

        // 1. Delete all job applications
        await execute("DELETE FROM job_applications WHERE user_id = ?", [id]);

        // 2. Delete candidate experience/education
        await execute("DELETE FROM candidate_experience WHERE user_id = ?", [id]);
        await execute("DELETE FROM candidate_education WHERE user_id = ?", [id]);

        // 3. Delete the user
        await execute("DELETE FROM users WHERE id = ?", [id]);

        return NextResponse.json({ success: true, message: "Candidate deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
