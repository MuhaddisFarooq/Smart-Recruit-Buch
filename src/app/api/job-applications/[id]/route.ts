import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

// GET /api/job-applications/[id] - Fetch single application details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Fetch Application + User + Job details
        const rows = await query(`
            SELECT 
                ja.id as application_id,
                ja.user_id,
                ja.status,
                ja.applied_at,
                ja.applied_at,
                ja.score,
                ja.message,
                ja.offer_letter_url,
                ja.signed_offer_letter_url,
                ja.offered_salary,
                ja.appointment_letter_url,
                ja.signed_appointment_letter_url,
                ja.joining_form_url,
                ja.hostel_form_url,
                ja.transport_form_url,
                u.avatar_url,
                COALESCE(ja.resume_path, ja.resume_url, u.resume_url) as resume_url,
                u.name,
                u.email,
                u.phone,
                u.city,
                u.country,
                u.cnic,
                u.position as current_title,
                NULL as current_company,
                j.id as job_id,
                j.job_title,
                j.status as job_status,
                j.department,
                j.salary_from,
                j.type_of_employment
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            JOIN jobs j ON ja.job_id = j.id
            WHERE ja.id = ?
        `, [id]);

        if (rows.length === 0) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const app = rows[0];

        // Fetch Experience from separate table using user_id
        const experience_list = await query(`
            SELECT * FROM candidate_experience 
            WHERE user_id = ? 
            ORDER BY is_current DESC, start_date DESC
        `, [app.user_id]);

        // Fetch Education from separate table using user_id
        const education_list = await query(`
            SELECT * FROM candidate_education 
            WHERE user_id = ? 
            ORDER BY is_current DESC, start_date DESC
        `, [app.user_id]);

        return NextResponse.json({
            ...app,
            experience_list: Array.isArray(experience_list) ? experience_list : [],
            education_list: Array.isArray(education_list) ? education_list : []
        });

    } catch (error: any) {
        console.error("Error fetching application:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to get user ID
async function getUserId(session: any) {
    if (!session?.user) return null;
    let userId = (session.user as any).id;
    if (!userId && session.user.email) {
        const rows = await query("SELECT id FROM users WHERE email = ?", [session.user.email]);
        if (Array.isArray(rows) && rows.length > 0) {
            userId = (rows[0] as any).id;
        }
    }
    return userId;
}

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

        const userId = await getUserId(session);
        if (!userId) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        // Validate status enum
        const validStatuses = ['new', 'reviewed', 'shortlisted', 'interview', 'selected', 'offered', 'hired', 'rejected', 'withdrawn'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Fetch current status
        const currentApp = await query("SELECT status FROM job_applications WHERE id = ?", [id]);
        const previousStatus = currentApp.length > 0 ? currentApp[0].status : null;

        await execute(
            "UPDATE job_applications SET status = ? WHERE id = ?",
            [status, id]
        );

        // Log the status change
        await execute(
            `INSERT INTO application_status_logs (application_id, previous_status, new_status, changed_by_user_id) 
             VALUES (?, ?, ?, ?)`,
            [id, previousStatus, status, userId]
        );

        // --- Notification Trigger ---
        // 1. Get candidate name and job title for the message
        try {
            const details = await query(`
                SELECT u.name as candidate_name, j.job_title 
                FROM job_applications ja
                JOIN users u ON ja.user_id = u.id
                JOIN jobs j ON ja.job_id = j.id
                WHERE ja.id = ?
            `, [id]);

            if (details.length > 0) {
                const { candidate_name, job_title } = details[0];
                const notificationTitle = `Application Status Updated`;
                const notificationMessage = `${candidate_name}'s application for ${job_title} was moved to ${status}.`;

                // Notify the recruiter (user_id = 1 for demo)
                // TODO: Notify the Job Owner or Hiring Manager instead of hardcoded 1
                // For now, let's notify the current user (recruiter) to avoid foreign key errors if 1 doesn't exist
                await execute(
                    `INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)`,
                    [userId, 'info', notificationTitle, notificationMessage, JSON.stringify({ application_id: id, status })]
                );

                // --- Notify the Candidate ---
                const candidateRes = await query("SELECT user_id FROM job_applications WHERE id = ?", [id]);
                if (candidateRes.length > 0) {
                    const candidateId = candidateRes[0].user_id;
                    const candidateMsg = `Your application for ${job_title} has been moved to ${status}.`;
                    await execute(
                        `INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)`,
                        [candidateId, 'info', 'Application Update', candidateMsg, JSON.stringify({ application_id: id, status })]
                    );
                }
            }
        } catch (filesErr) {
            console.error("Failed to create notification", filesErr);
        }

        // --- Email Notification for Shortlisting ---
        if (status === 'shortlisted') {
            try {
                // Fetch candidate's email
                const candidateRes = await query(`
                    SELECT u.email, u.name, j.job_title 
                    FROM job_applications ja
                    JOIN users u ON ja.user_id = u.id
                    JOIN jobs j ON ja.job_id = j.id
                    WHERE ja.id = ?
                `, [id]);

                if (candidateRes.length > 0) {
                    const { email, name, job_title } = candidateRes[0];
                    const { sendEmail, getShortlistEmailTemplate } = await import("@/lib/email");
                    const emailContent = getShortlistEmailTemplate(name, job_title);

                    console.log(`Sending shortlist email to ${email}`);
                    await sendEmail(email, "You have been Shortlisted - Buch International Hospital", emailContent);
                }
            } catch (emailErr) {
                console.error("Failed to send shortlist email", emailErr);
            }
        }
        // -------------------------------------------
        // ----------------------------

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
