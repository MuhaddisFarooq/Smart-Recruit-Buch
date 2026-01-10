import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/jobs/[id]/applications - Get all applications for a job
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch applications with candidate details
        // We join with users table for basic info
        // We also want current company (from candidate_experience) and current title if available
        const applications = await query(`
            SELECT 
                ja.id as application_id,
                ja.user_id,
                ja.status,
                ja.applied_at,
                ja.resume_path as resume_url,
                u.name,
                u.email,
                u.phone,
                u.city,
                u.country,
                (
                    SELECT title 
                    FROM candidate_experience 
                    WHERE user_id = u.id AND is_current = 1 
                    LIMIT 1
                ) as current_title,
                (
                    SELECT company 
                    FROM candidate_experience 
                    WHERE user_id = u.id AND is_current = 1 
                    LIMIT 1
                ) as current_company
            FROM job_applications ja
            LEFT JOIN users u ON ja.user_id = u.id
            WHERE ja.job_id = ?
            ORDER BY ja.applied_at DESC
        `, [id]);

        // If no applications, return early
        if (!applications.length) {
            return NextResponse.json([]);
        }

        // Collect distinct user_ids
        const userIds = applications.map((app: any) => app.user_id).filter((uid: any) => uid);

        if (userIds.length > 0) {
            // Fetch Experience and Education safely in separate queries
            const educationRows = await query(`SELECT * FROM candidate_education WHERE user_id IN (${userIds.join(',')})`);
            const experienceRows = await query(`SELECT * FROM candidate_experience WHERE user_id IN (${userIds.join(',')}) ORDER BY start_date DESC`);

            // Map data to applications
            applications.forEach((app: any) => {
                if (app.user_id) {
                    app.education_list = educationRows.filter((edu: any) => edu.user_id === app.user_id);
                    app.experience_list = experienceRows.filter((exp: any) => exp.user_id === app.user_id);
                } else {
                    app.education_list = [];
                    app.experience_list = [];
                }
            });
        }

        return NextResponse.json(applications);
    } catch (error: any) {
        console.error("Error fetching applications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
