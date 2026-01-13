import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

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

// GET /api/jobs/[id] - Get a specific job
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        const userId = await getUserId(session);
        const rows = await query(`
            SELECT *, 
            ${userId ? `(SELECT COUNT(*) FROM job_applications WHERE job_id = jobs.id AND user_id = ${userId}) > 0` : 'FALSE'} as has_applied
            FROM jobs WHERE id = ?
        `, [id]);

        if (Array.isArray(rows) && rows.length > 0) {
            return NextResponse.json({
                ...rows[0],
                // Add aggregated counts for the dashboard
                new_count: (await query("SELECT COUNT(*) as count FROM job_applications WHERE job_id = ? AND status = 'new'", [id]) as any)[0].count,
                in_review_count: (await query("SELECT COUNT(*) as count FROM job_applications WHERE job_id = ? AND status = 'reviewed'", [id]) as any)[0].count,
                interview_count: (await query("SELECT COUNT(*) as count FROM job_applications WHERE job_id = ? AND status = 'interview'", [id]) as any)[0].count,
                offered_count: (await query("SELECT COUNT(*) as count FROM job_applications WHERE job_id = ? AND status = 'offered'", [id]) as any)[0].count,
                hired_count: (await query("SELECT COUNT(*) as count FROM job_applications WHERE job_id = ? AND status = 'hired'", [id]) as any)[0].count,
                all_active_count: (await query("SELECT COUNT(*) as count FROM job_applications WHERE job_id = ? AND status NOT IN ('hired', 'rejected', 'withdrawn')", [id]) as any)[0].count,
                withdrawn_count: (await query("SELECT COUNT(*) as count FROM job_applications WHERE job_id = ? AND status = 'withdrawn'", [id]) as any)[0].count,
                rejected_count: (await query("SELECT COUNT(*) as count FROM job_applications WHERE job_id = ? AND status = 'rejected'", [id]) as any)[0].count,
            });
        }

        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/jobs/[id] - Update a job (including unpublish)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const updatedBy = session?.user?.name || session?.user?.email || "Unknown User";

        const { id } = await params;
        const body = await req.json();

        // Build dynamic update query
        const fields: string[] = [];
        const values: any[] = [];

        if (body.job_title !== undefined) { fields.push("job_title = ?"); values.push(body.job_title || null); }
        if (body.location !== undefined) { fields.push("location = ?"); values.push(body.location || null); }
        if (body.status !== undefined) { fields.push("status = ?"); values.push(body.status || null); }
        if (body.work_location_type !== undefined) { fields.push("work_location_type = ?"); values.push(body.work_location_type || null); }
        if (body.job_language !== undefined) { fields.push("job_language = ?"); values.push(body.job_language || null); }
        if (body.company_description !== undefined) { fields.push("company_description = ?"); values.push(body.company_description || null); }
        if (body.description !== undefined) { fields.push("description = ?"); values.push(body.description || null); }
        if (body.qualifications !== undefined) { fields.push("qualifications = ?"); values.push(body.qualifications || null); }
        if (body.additional_information !== undefined) { fields.push("additional_information = ?"); values.push(body.additional_information || null); }
        if (body.video_url !== undefined) { fields.push("video_url = ?"); values.push(body.video_url || null); }
        if (body.industry !== undefined) { fields.push("industry = ?"); values.push(body.industry || null); }
        if (body.job_function !== undefined) { fields.push("job_function = ?"); values.push(body.job_function || null); }
        if (body.experience_level !== undefined) { fields.push("experience_level = ?"); values.push(body.experience_level || null); }
        if (body.type_of_employment !== undefined) { fields.push("type_of_employment = ?"); values.push(body.type_of_employment || null); }
        if (body.salary_from !== undefined) { fields.push("salary_from = ?"); values.push(body.salary_from || null); }
        if (body.salary_to !== undefined) { fields.push("salary_to = ?"); values.push(body.salary_to || null); }
        if (body.currency !== undefined) { fields.push("currency = ?"); values.push(body.currency || null); }
        if (body.salary_period !== undefined) { fields.push("salary_period = ?"); values.push(body.salary_period || null); }
        if (body.hiring_team !== undefined) { fields.push("hiring_team = ?"); values.push(body.hiring_team ? JSON.stringify(body.hiring_team) : null); }

        // New location fields
        if (body.city !== undefined) { fields.push("city = ?"); values.push(body.city || null); }
        if (body.state !== undefined) { fields.push("state = ?"); values.push(body.state || null); }
        if (body.postal_code !== undefined) { fields.push("postal_code = ?"); values.push(body.postal_code || null); }
        if (body.country !== undefined) { fields.push("country = ?"); values.push(body.country || null); }
        if (body.internal_notes !== undefined) { fields.push("internal_notes = ?"); values.push(body.internal_notes || null); }
        if (body.target_hiring_date !== undefined) { fields.push("target_hiring_date = ?"); values.push(body.target_hiring_date || null); }
        if (body.attachments !== undefined) { fields.push("attachments = ?"); values.push(body.attachments || null); }

        // Auto unpublish date handling
        if (body.auto_unpublish_date !== undefined) {
            let autoDate = body.auto_unpublish_date;

            // If publishing, only clear the date if it's in the past or today
            if ((body.status === 'active' || body.status === 'published') && autoDate) {
                const unpublishDate = new Date(autoDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                unpublishDate.setHours(0, 0, 0, 0);

                // Clear past/today dates, keep future dates
                if (unpublishDate <= today) {
                    autoDate = null;
                }
            }

            fields.push("auto_unpublish_date = ?");
            values.push(autoDate || null);
        }

        // Always update updatedBy and updatedDate
        fields.push("updatedBy = ?");
        values.push(updatedBy);
        fields.push("updatedDate = NOW()");

        values.push(id);

        await execute(
            `UPDATE jobs SET ${fields.join(", ")} WHERE id = ?`,
            values
        );

        return NextResponse.json({ success: true, message: "Job updated successfully" });
    } catch (error: any) {
        console.error("Error updating job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await execute("DELETE FROM jobs WHERE id = ?", [id]);
        return NextResponse.json({ success: true, message: "Job deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
