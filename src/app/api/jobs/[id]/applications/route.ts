import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { calculateScore } from "@/lib/scoring";

// GET /api/jobs/[id]/applications - Get all applications for a job
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Fetch Job Details (Required for scoring)
        const jobRes = await query(`
            SELECT job_title, description, qualifications, experience_level, type_of_employment
            FROM jobs WHERE id = ?
        `, [id]);

        if (jobRes.length === 0) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }
        const jobData = jobRes[0];
        const job = {
            title: jobData.job_title,
            description: jobData.description || "",
            qualifications: jobData.qualifications || "",
            experience_level: jobData.experience_level || ""
        };

        // 2. Fetch applications with candidate details using Lazy Migration Pattern
        // We join with users table for basic info
        let applications;
        try {
            applications = await fetchApplicationsWithRetry(id);
        } catch (error: any) {
            // Lazy Migration: Check for missing columns
            if (error.code === 'ER_BAD_FIELD_ERROR' || error.message?.includes("Unknown column 'ja.appointment_letter_url'")) {
                console.warn("Lazy Migration: Adding missing appointment letter columns...");
                await execute("ALTER TABLE job_applications ADD COLUMN appointment_letter_url VARCHAR(255) NULL");
                await execute("ALTER TABLE job_applications ADD COLUMN signed_appointment_letter_url VARCHAR(255) NULL");
                // Retry
                applications = await fetchApplicationsWithRetry(id);
            } else {
                throw error;
            }
        }

        // Helper function for the main query
        async function fetchApplicationsWithRetry(jobId: string) {
            return await query(`
            SELECT 
                ja.id as application_id,
                ja.user_id,
                ja.status,
                ja.applied_at,
                ja.score,
                ja.offered_salary,
                ja.offer_letter_url,
                ja.signed_offer_letter_url,
                ja.appointment_letter_url,
                ja.signed_appointment_letter_url,
                COALESCE(ja.resume_path, ja.resume_url, u.resume_url) as resume_url,
                u.name,
                u.email,
                u.phone,
                u.city,
                u.country,
                u.country,
                u.cnic,
                u.avatar_url,
                (SELECT COUNT(*) FROM interview_panels WHERE application_id = ja.id) as panel_member_count,
                (
                    SELECT title 
                    FROM candidate_experience 
                    WHERE user_id = u.id 
                    ORDER BY is_current DESC, start_date DESC 
                    LIMIT 1
                ) as current_title,
                (
                    SELECT company 
                    FROM candidate_experience 
                    WHERE user_id = u.id 
                    ORDER BY is_current DESC, start_date DESC 
                    LIMIT 1
                ) as current_company,
                (
                    SELECT u2.name 
                    FROM application_status_logs asl
                    JOIN users u2 ON asl.changed_by_user_id = u2.id
                    WHERE asl.application_id = ja.id
                    ORDER BY asl.created_at DESC
                    LIMIT 1
                ) as last_status_change_by,
                (
                 SELECT u2.role 
                    FROM application_status_logs asl
                    JOIN users u2 ON asl.changed_by_user_id = u2.id
                    WHERE asl.application_id = ja.id
                    ORDER BY asl.created_at DESC
                    LIMIT 1
                ) as last_status_changer_role
            FROM job_applications ja
            LEFT JOIN users u ON ja.user_id = u.id
            WHERE ja.job_id = ?
        `, [jobId]);
        }

        // If no applications, return early
        if (!applications.length) {
            return NextResponse.json([]);
        }

        // 3. Fetch Experience and Education for ALL candidates
        const userIds = applications.map((app: any) => app.user_id).filter((uid: any) => uid);
        let educationRows: any[] = [];
        let experienceRows: any[] = [];

        if (userIds.length > 0) {
            educationRows = await query(`SELECT * FROM candidate_education WHERE user_id IN (${userIds.join(',')})`);
            experienceRows = await query(`SELECT * FROM candidate_experience WHERE user_id IN (${userIds.join(',')}) ORDER BY start_date DESC`);
        }

        // 4. Process Applications (Map Data + Auto-Score)
        const updates: Promise<any>[] = [];

        applications.forEach((app: any) => {
            // Attach nested data
            if (app.user_id) {
                app.education_list = educationRows.filter((edu: any) => edu.user_id === app.user_id);
                app.experience_list = experienceRows.filter((exp: any) => exp.user_id === app.user_id);
            } else {
                app.education_list = [];
                app.experience_list = [];
            }

            // Auto-Analyze if score is 0
            if (!app.score || Number(app.score) === 0) {
                const candidate = {
                    title: app.current_title || "Candidate",
                    experience: app.experience_list,
                    education: app.education_list,
                    resume_text: ""
                };

                const newScore = calculateScore(job, candidate);
                app.score = newScore; // Update in memory

                // Queue DB update
                updates.push(execute("UPDATE job_applications SET score = ? WHERE id = ?", [newScore, app.application_id]));
            }
        });

        // Fire and forget DB updates (or await if critical, here better to ensure consistency)
        if (updates.length > 0) {
            await Promise.all(updates);
        }

        // 5. Sort by Score DESC
        applications.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

        return NextResponse.json(applications);
    } catch (error: any) {
        console.error("Error fetching applications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
