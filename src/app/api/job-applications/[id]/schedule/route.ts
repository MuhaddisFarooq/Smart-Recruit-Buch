
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

        // --- Send Email Notification ---
        try {
            // Import query dynamically or ensure it's imported at top
            const { query } = await import("@/lib/db");

            const details = await query(`
                SELECT u.email, u.name, j.job_title 
                FROM job_applications ja
                JOIN users u ON ja.user_id = u.id
                JOIN jobs j ON ja.job_id = j.id
                WHERE ja.id = ?
            `, [id]);

            if (details.length > 0) {
                const { email, name, job_title } = details[0];
                const { sendEmail, getInterviewEmailTemplate } = await import("@/lib/email");
                const emailContent = getInterviewEmailTemplate(name, job_title, interview_date);

                await sendEmail(email, `Interview Application for ${job_title} - Buch International Hospital`, emailContent);
            }
        } catch (emailErr) {
            console.error("Failed to send interview email", emailErr);
        }
        // -------------------------------

        return NextResponse.json({ success: true, message: "Interview scheduled" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
