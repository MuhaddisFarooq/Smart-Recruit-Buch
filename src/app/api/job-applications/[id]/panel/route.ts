
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

// GET /api/job-applications/[id]/panel - Get panel members
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        const members = await query(`
            SELECT 
                ip.id,
                ip.user_id,
                ip.role,
                u.name,
                u.email,
                u.avatar_url
            FROM interview_panels ip
            JOIN users u ON ip.user_id = u.id
            WHERE ip.application_id = ?
        `, [id]);

        return NextResponse.json(members);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/job-applications/[id]/panel - Add panel member
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { user_id, role } = body;

        if (!user_id || !role) {
            return NextResponse.json({ error: "User and role are required" }, { status: 400 });
        }

        // Check if already exists
        const existing = await query(
            "SELECT id FROM interview_panels WHERE application_id = ? AND user_id = ?",
            [id, user_id]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "User already in panel" }, { status: 400 });
        }

        await execute(
            "INSERT INTO interview_panels (application_id, user_id, role) VALUES (?, ?, ?)",
            [id, user_id, role]
        );

        // --- Send Email Notification ---
        try {
            // Fetch necessary details for email
            const details = await query(`
                SELECT 
                    j.job_title,
                    u_candidate.name as candidate_name,
                    u_adder.name as adder_name,
                    u_member.name as member_name,
                    u_member.email as member_email,
                    ja.interview_date
                FROM job_applications ja
                JOIN jobs j ON ja.job_id = j.id
                JOIN users u_candidate ON ja.user_id = u_candidate.id
                JOIN users u_member ON u_member.id = ?
                LEFT JOIN users u_adder ON u_adder.email = ? -- Fallback if ID not available in session easily, but we have session
                WHERE ja.id = ?
            `, [user_id, session.user?.email, id]);

            if (details.length > 0) {
                const info = details[0];
                const adderName = session.user?.name || info.adder_name || "Admin";

                const { sendEmail, getPanelMemberAddedEmailTemplate } = await import("@/lib/email");
                const emailContent = getPanelMemberAddedEmailTemplate(
                    info.member_name,
                    adderName,
                    info.candidate_name,
                    info.job_title,
                    info.interview_date
                );

                await sendEmail(info.member_email, `Added to Interview Panel - ${info.job_title}`, emailContent);
            }
        } catch (emailErr) {
            console.error("Failed to send panel email", emailErr);
        }
        // -------------------------------

        return NextResponse.json({ success: true, message: "Added to panel" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/job-applications/[id]/panel - Remove panel member
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get("user_id");

        if (!user_id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const { id } = await params;

        await execute(
            "DELETE FROM interview_panels WHERE application_id = ? AND user_id = ?",
            [id, user_id]
        );

        return NextResponse.json({ success: true, message: "Removed from panel" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
