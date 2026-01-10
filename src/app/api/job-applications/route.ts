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

        const applications = await query(
            `SELECT ja.*, j.job_title, j.location, j.city, j.country 
             FROM job_applications ja 
             LEFT JOIN jobs j ON ja.job_id = j.id 
             WHERE ja.user_id = ? 
             ORDER BY ja.applied_at DESC`,
            [userId]
        );

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

        // Check if already applied
        if (userId) {
            const existing = await query(
                "SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?",
                [jobId, userId]
            );

            if (Array.isArray(existing) && existing.length > 0) {
                return NextResponse.json({ error: "You have already applied for this job" }, { status: 400 });
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

        return NextResponse.json({
            id: applicationId,
            message: "Application submitted successfully"
        });
    } catch (error: any) {
        console.error("Error creating application:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
