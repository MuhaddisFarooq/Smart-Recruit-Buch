import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";
import fs from "fs";
import path from "path";

// GET /api/job-applications - Get applications for current user
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user ID from session
        const users = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [session.user.email]);
        const userId = Array.isArray(users) && users.length > 0 ? (users[0] as any).id : null;

        if (!userId) {
            return NextResponse.json([]);
        }

        let applications;
        try {
            applications = await fetchApplicationsWithRetry(userId);
        } catch (error: any) {
            if (error.code === 'ER_BAD_FIELD_ERROR' || error.message?.includes("Unknown column")) {
                console.warn("Lazy Migration: Adding missing appointment letter columns...");
                await execute("ALTER TABLE job_applications ADD COLUMN appointment_letter_url VARCHAR(255) NULL");
                await execute("ALTER TABLE job_applications ADD COLUMN signed_appointment_letter_url VARCHAR(255) NULL");
                applications = await fetchApplicationsWithRetry(userId);
            } else {
                throw error;
            }
        }

        async function fetchApplicationsWithRetry(uid: string) {
            return await query(
                `SELECT ja.*, 
                ja.offer_letter_url, ja.signed_offer_letter_url, 
                ja.appointment_letter_url, ja.signed_appointment_letter_url,
                j.job_title, j.location, j.city, j.country, j.type_of_employment
                 FROM job_applications ja 
                 LEFT JOIN jobs j ON ja.job_id = j.id 
                 WHERE ja.user_id = ? 
                 ORDER BY ja.applied_at DESC`,
                [uid]
            );
        }

        return NextResponse.json(applications);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/job-applications - Create new application
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Get user ID if logged in
        let userId = null;
        if (session?.user?.email) {
            const users = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [session.user.email]);
            userId = Array.isArray(users) && users.length > 0 ? (users[0] as any).id : null;
        }

        const formData = await req.formData();
        const jobId = formData.get("jobId") as string;
        const fullName = formData.get("fullName") as string;
        const email = formData.get("email") as string;
        const city = formData.get("city") as string || null;
        const phone = formData.get("phone") as string || null;
        const linkedin = formData.get("linkedin") as string || null;
        const facebook = formData.get("facebook") as string || null;
        const twitter = formData.get("twitter") as string || null;
        const website = formData.get("website") as string || null;
        const message = formData.get("message") as string || null;
        const experiencesJson = formData.get("experiences") as string || "[]";
        const educationsJson = formData.get("educations") as string || "[]";
        const resumeFile = formData.get("resume") as File | null;

        if (!jobId || !fullName || !email) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if already applied or has active application
        if (userId) {
            // Check for ANY active application
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
        }

        // Handle resume file upload
        let resumeUrl = null;
        if (resumeFile) {
            const bytes = await resumeFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileName = `resume_${Date.now()}_${resumeFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            resumeUrl = `/uploads/resumes/${fileName}`;
        }

        // Insert into job_applications table (matching your existing schema)
        const result = await execute(
            `INSERT INTO job_applications (job_id, user_id, resume_url, message, status, applied_at) 
             VALUES (?, ?, ?, ?, 'Applied', NOW())`,
            [jobId, userId, resumeUrl, message]
        );

        const applicationId = result.insertId;

        // Parse and save experiences to candidate_experience table
        const experiences = JSON.parse(experiencesJson);
        for (const exp of experiences) {
            await execute(
                `INSERT INTO candidate_experience 
                 (user_id, title, company, location, description, start_date, end_date, is_current, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    userId,
                    exp.title,
                    exp.company,
                    exp.location || null,
                    exp.description || null,
                    exp.start_date ? `${exp.start_date}-01` : null,
                    exp.end_date ? `${exp.end_date}-01` : null,
                    exp.is_current ? 1 : 0,
                ]
            );
        }

        // Parse and save educations to candidate_education table
        const educations = JSON.parse(educationsJson);
        for (const edu of educations) {
            await execute(
                `INSERT INTO candidate_education 
                 (user_id, institution, major, degree, location, description, start_date, end_date, is_current, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    userId,
                    edu.institution,
                    edu.major || null,
                    edu.degree || null,
                    edu.location || null,
                    null, // description
                    edu.start_date ? `${edu.start_date}-01` : null,
                    edu.end_date ? `${edu.end_date}-01` : null,
                    edu.is_current ? 1 : 0,
                ]
            );
        }

        // Update User's Designation and Department from the Job
        if (userId) {
            const jobDetails = await query("SELECT job_title, department FROM jobs WHERE id = ?", [jobId]);

            if (Array.isArray(jobDetails) && jobDetails.length > 0) {
                const job = (jobDetails as any[])[0];

                await execute(
                    "UPDATE users SET designation = ?, department = ? WHERE id = ?",
                    [job.job_title, job.department, userId]
                );
            }
        }

        return NextResponse.json({
            id: applicationId,
            message: "Application submitted successfully"
        });
    } catch (error: any) {
        console.error("Error creating application:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
