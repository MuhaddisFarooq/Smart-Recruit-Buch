
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query } from "@/lib/db";
import { executeWebsiteQuery } from "@/lib/websiteDb";
import { authOptions } from "@/lib/auth/options";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // 1. Fetch Job from Local DB
        const jobRows = await query(`
            SELECT * FROM jobs WHERE id = ?
        `, [id]);

        if (jobRows.length === 0) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const job = jobRows[0];
        const userEmail = session.user?.email || "admin@example.com";

        // Construct Job Link (assuming portal link)
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const jobLink = `${baseUrl}/jobs/${id}/apply`;

        // 2. Check if already exists in Website DB using job_link (unique ref)
        const existingExternalJob = await executeWebsiteQuery(
            `SELECT id FROM careers WHERE job_link = ?`,
            [jobLink]
        ) as any[];

        if (existingExternalJob.length > 0) {
            // Update existing
            await executeWebsiteQuery(`
                UPDATE careers SET 
                    job_title = ?, 
                    type_of_employment = ?, 
                    department = ?, 
                    location = ?, 
                    status = ?, 
                    addedBy = ?,
                    addedDate = NOW()
                WHERE job_link = ?
            `, [
                job.job_title,
                job.type_of_employment || "Full-Time",
                job.department,
                job.location,
                "active",
                userEmail,
                jobLink
            ]);
        } else {
            // Insert new
            await executeWebsiteQuery(`
                INSERT INTO careers (
                    job_title, 
                    type_of_employment, 
                    department, 
                    location, 
                    job_link, 
                    status, 
                    addedBy, 
                    addedDate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                job.job_title,
                job.type_of_employment || "Full-Time",
                job.department,
                job.location,
                jobLink,
                "active",
                userEmail
            ]);
        }

        // 3. Update Local DB advertisted_date
        await query(`UPDATE jobs SET advertised_date = NOW() WHERE id = ?`, [id]);

        return NextResponse.json({ success: true, message: "Job advertised successfully" });

    } catch (error: any) {
        console.error("Error advertising job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
