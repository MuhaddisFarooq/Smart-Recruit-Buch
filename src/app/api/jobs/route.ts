import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

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

export async function GET(req: NextRequest) {
    try {
        // Auto-unpublish jobs that have passed their auto_unpublish_date
        // Also clear the date so the job can be republished later
        await execute(`
            UPDATE jobs 
            SET status = 'inactive', auto_unpublish_date = NULL 
            WHERE auto_unpublish_date IS NOT NULL 
            AND auto_unpublish_date < CURDATE() 
            AND (status = 'active' OR status = 'published')
        `, []);

        const session = await getServerSession(authOptions);
        const userId = await getUserId(session);

        const jobs = await query(`
            SELECT j.*, 
                (SELECT u.name FROM job_hiring_team ht JOIN users u ON ht.user_id = u.id WHERE ht.job_id = j.id AND ht.role = 'Recruiter' LIMIT 1) as recruiter,
                (SELECT u.name FROM job_hiring_team ht JOIN users u ON ht.user_id = u.id WHERE ht.job_id = j.id AND ht.role = 'Hiring Manager' LIMIT 1) as hiring_manager,
                (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'new') as new_count,
                (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'reviewed') as in_review_count,
                (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'shortlisted') as shortlisted_count,
                (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'interview') as interview_count,
                (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'selected') as selected_count,
                (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'offered') as offered_count,
                (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'hired') as hired_count,
                ${userId ? `(SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.user_id = ${userId}) > 0` : 'FALSE'} as has_applied,
                j.advertised_date,
                j.updatedDate
            FROM jobs j 
            ORDER BY j.addedDate DESC
        `);
        return NextResponse.json(jobs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const addedBy = session?.user?.name || session?.user?.email || "Unknown User";

        const body = await req.json();

        // Extract all fields with null fallback to prevent undefined
        const job_title = body.job_title || null;
        const department = body.department || null;
        const department_id = body.department_id || null;
        const hod_id = body.hod_id || null;
        const location = body.location || null;
        const work_location_type = body.work_location_type || null;
        const job_language = body.job_language || null;
        const company_description = body.company_description || null;
        const description = body.description || null;
        const qualifications = body.qualifications || null;
        const additional_info = body.additional_info || null;
        const video_url = body.video_url || null;
        const industry = body.industry || null;
        const job_function = body.function || null;
        const experience_level = body.experience_level || null;
        const type_of_employment = body.type_of_employment || null;
        const salary_from = body.salary_from || null;
        const salary_to = body.salary_to || null;
        const currency = body.currency || null;
        const salary_period = body.salary_period || null;
        const hiring_team = body.hiring_team ? JSON.stringify(body.hiring_team) : null;
        const status = body.status || "draft";

        // New location fields
        const city = body.city || null;
        const state = body.state || null;
        const postal_code = body.postal_code || null;
        const country = body.country || null;

        // Auto unpublish date
        const auto_unpublish_date = body.auto_unpublish_date || null;

        const result = await execute(
            `INSERT INTO jobs (
                job_title, department, department_id, hod_id, location, work_location_type, job_language,
                company_description, description, qualifications, additional_information,
                video_url, industry, job_function, experience_level, type_of_employment,
                salary_from, salary_to, currency, salary_period, hiring_team,
                city, state, postal_code, country, auto_unpublish_date,
                status, addedBy, addedDate, updatedBy, updatedDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
            [
                job_title,
                department,
                department_id,
                hod_id,
                location,
                work_location_type,
                job_language,
                company_description,
                description,
                qualifications,
                additional_info,
                video_url,
                industry,
                job_function,
                experience_level,
                type_of_employment,
                salary_from,
                salary_to,
                currency,
                salary_period,
                hiring_team,
                city,
                state,
                postal_code,
                country,
                auto_unpublish_date,
                status,
                addedBy,
                addedBy,
            ]
        );

        const jobId = (result as any).insertId;

        // Insert hiring team members into job_hiring_team table
        if (body.hiring_team && Array.isArray(body.hiring_team) && body.hiring_team.length > 0) {
            const teamValues = body.hiring_team.map((member: any) => [
                jobId,
                member.user_id,
                member.role
            ]);

            // Construct bulk insert query
            const placeholders = teamValues.map(() => "(?, ?, ?)").join(", ");
            const flatValues = teamValues.flat();

            if (teamValues.length > 0) {
                await execute(
                    `INSERT INTO job_hiring_team (job_id, user_id, role) VALUES ${placeholders}
                     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
                    flatValues
                );
            }
        }

        return NextResponse.json({ id: jobId, message: "Job created successfully" });
    } catch (error: any) {
        console.error("Error creating job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
