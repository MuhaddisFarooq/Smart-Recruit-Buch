import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { execute, query } from "@/lib/db";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: jobId } = await params;
        const body = await req.json();
        const {
            // Referral (friend) details
            referralFirstName,
            referralLastName,
            referralEmail,
            referralPhone,
            relationship,
            recommendation,
            referralResumeUrl,
            // Referrer details
            referrerFirstName,
            referrerLastName,
            referrerEmail
        } = body;

        // Get referrer user ID from session
        let referrerUserId = (session.user as any).id;
        if (!referrerUserId && session.user.email) {
            const rows = await query("SELECT id FROM users WHERE email = ?", [session.user.email]);
            if (Array.isArray(rows) && rows.length > 0) {
                referrerUserId = (rows[0] as any).id;
            }
        }

        // Insert referral record
        await execute(
            `INSERT INTO job_referrals (
                job_id,
                referral_first_name,
                referral_last_name,
                referral_email,
                referral_phone,
                relationship,
                recommendation,
                referral_resume_url,
                referrer_first_name,
                referrer_last_name,
                referrer_email,
                referrer_user_id,
                status,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())`,
            [
                jobId,
                referralFirstName || null,
                referralLastName || null,
                referralEmail || null,
                referralPhone || null,
                relationship || null,
                recommendation || null,
                referralResumeUrl || null,
                referrerFirstName || null,
                referrerLastName || null,
                referrerEmail || null,
                referrerUserId || null
            ]
        );

        return NextResponse.json({ success: true, message: "Referral submitted successfully" });

    } catch (error: any) {
        console.error("Referral error:", error);
        return NextResponse.json({ error: error.message || "Failed to submit referral" }, { status: 500 });
    }
}
