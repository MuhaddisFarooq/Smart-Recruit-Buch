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
            personalInfo, // { name, email, city, phone }
            experience,   // Array of { title, company, location, description, startDate, endDate, isCurrent }
            education,    // Array of { institution, major, degree, location, description, startDate, endDate, isCurrent }
            socialLinks,  // { linkedin, facebook, twitter, website }
            resumeUrl,
            message
        } = body;

        // Get userId from session or lookup by email
        let userId = (session.user as any).id;
        if (!userId && session.user.email) {
            const rows = await query("SELECT id FROM users WHERE email = ?", [session.user.email]);
            if (Array.isArray(rows) && rows.length > 0) {
                userId = (rows[0] as any).id;
            }
        }

        // Debug: Log all values to find undefined
        console.log("Application submission debug:", {
            userId,
            jobId,
            personalInfo,
            socialLinks,
            resumeUrl,
            message,
            experienceCount: experience?.length,
            educationCount: education?.length
        });

        if (!userId) {
            return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
        }

        // Check for active applications
        const activeApplications = await query(
            `SELECT id, job_id, status FROM job_applications 
             WHERE user_id = ? 
             AND status NOT IN ('Rejected', 'Withdrawn')`,
            [userId]
        );

        if (Array.isArray(activeApplications) && activeApplications.length > 0) {
            const activeApp = (activeApplications as any[])[0];

            // If trying to apply to the SAME job again
            if (activeApp.job_id == jobId) {
                return NextResponse.json({ error: "You have already applied for this job." }, { status: 400 });
            }

            // If trying to apply to a NEW job while another is active
            return NextResponse.json({
                error: "You already have an active application. You cannot apply for another job until your current application is resolved (Rejected or Withdrawn)."
            }, { status: 400 });
        }

        // 1. Update User Profile
        // We update name, phone, city, and social links.
        await execute(
            `UPDATE users SET 
            name = ?, 
            phone = ?, 
            city = ?,
            linkedin_url = ?,
            facebook_url = ?,
            twitter_url = ?,
            website_url = ?,
            resume_url = ? 
        WHERE id = ?`,
            [
                personalInfo?.name || (session.user as any).name || null,
                personalInfo?.phone || null,
                personalInfo?.city || null,
                socialLinks?.linkedin || null,
                socialLinks?.facebook || null,
                socialLinks?.twitter || null,
                socialLinks?.website || null,
                resumeUrl || null,
                userId
            ]
        );

        // Update Designation and Department from Job
        const currentJobDetails = await query("SELECT job_title, department FROM jobs WHERE id = ?", [jobId]);
        if (Array.isArray(currentJobDetails) && currentJobDetails.length > 0) {
            const job = (currentJobDetails as any[])[0];
            await execute(
                "UPDATE users SET designation = ?, department = ? WHERE id = ?",
                [job.job_title, job.department, userId]
            );
        }

        // 2. Sync Experience
        // Delete existing and re-insert
        await execute("DELETE FROM candidate_experience WHERE user_id = ?", [userId]);
        if (Array.isArray(experience) && experience.length > 0) {
            for (const exp of experience) {
                // Basic validation or default handling
                await execute(
                    `INSERT INTO candidate_experience (user_id, title, company, location, description, start_date, end_date, is_current)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        exp.title || null,
                        exp.company || null,
                        exp.location || null,
                        exp.description || null,
                        exp.startDate ? new Date(exp.startDate) : null,
                        exp.endDate ? new Date(exp.endDate) : null,
                        exp.isCurrent ? 1 : 0
                    ]
                );
            }
        }

        // 3. Sync Education
        await execute("DELETE FROM candidate_education WHERE user_id = ?", [userId]);
        if (Array.isArray(education) && education.length > 0) {
            for (const edu of education) {
                await execute(
                    `INSERT INTO candidate_education (user_id, institution, major, degree, location, description, start_date, end_date, is_current)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        edu.institution || null,
                        edu.major || null,
                        edu.degree || null,
                        edu.location || null,
                        edu.description || null,
                        edu.startDate ? new Date(edu.startDate) : null,
                        edu.endDate ? new Date(edu.endDate) : null,
                        edu.isCurrent ? 1 : 0
                    ]
                );
            }
        }

        // 4. Create Application
        await execute(
            `INSERT INTO job_applications (job_id, user_id, resume_path, message, status, applied_at)
         VALUES (?, ?, ?, ?, 'Applied', NOW())`,
            [jobId, userId, resumeUrl || null, message || null]
        );

        // --- Notification Trigger ---
        try {
            // Get Job Title and Candidate Name
            const jobRows = await query("SELECT job_title FROM jobs WHERE id = ?", [jobId]);
            const jobTitle = jobRows[0]?.job_title || "Job";
            const candidateName = personalInfo?.name || (session.user as any).name || "A candidate";

            const notificationTitle = `New Application Received`;
            const notificationMessage = `${candidateName} applied for ${jobTitle}.`;

            // Notify the recruiter (user_id = 1 for demo)
            // In a real app, we would fetch the job's recruiter_id from the jobs table
            await execute(
                `INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)`,
                [1, 'success', notificationTitle, notificationMessage, JSON.stringify({ job_id: jobId, candidate_id: userId })]
            );
        } catch (notifErr) {
            console.error("Failed to create notification", notifErr);
        }
        // ----------------------------

        return NextResponse.json({ success: true, message: "Application submitted successfully" });

    } catch (error: any) {
        console.error("Application error:", error);
        return NextResponse.json({ error: error.message || "Failed to submit application" }, { status: 500 });
    }
}
