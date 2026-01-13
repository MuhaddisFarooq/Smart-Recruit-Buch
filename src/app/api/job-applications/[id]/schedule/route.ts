
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { execute } from "@/lib/db";
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
        const { interview_date } = body;

        if (!interview_date) return NextResponse.json({ error: "Interview date required" }, { status: 400 });

        // Update the application with interview date AND set status to 'interview' automatically
        await execute(
            "UPDATE job_applications SET interview_date = ?, status = 'interview', updated_at = NOW() WHERE id = ?",
            [new Date(interview_date), id]
        );

        return NextResponse.json({ success: true, message: "Interview scheduled" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
