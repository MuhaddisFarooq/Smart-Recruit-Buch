
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
        // Use environment variable for production URL, or fall back to production URL for safety
        const baseUrl = process.env.NEXTAUTH_URL || "https://career.buchhospital.com";
        const jobLink = `${baseUrl}/candidate/jobs/${id}`;

        const safeJobTitle = job.job_title || "Untitled Job";
        const safeType = job.type_of_employment || "Full-Time";
        const safeDept = job.department || "General";
        const safeLoc = (job.city && job.country) ? `${job.city}, ${job.country}` : (job.location || "Multan, Pakistan");

        // 2. Check if already exists in Website DB
        // First check for OLD link format (ending in /apply) or generic match
        // We want to force Update the link to the New Format (Details Page)
        let existingExternalJob = await executeWebsiteQuery(
            `SELECT id FROM careers WHERE job_link LIKE ? OR job_link LIKE ?`,
            [`%/jobs/${id}/apply`, `%/jobs/${id}`]
        ) as any[];

        if (existingExternalJob.length > 0) {
            console.log("Found existing job advert, updating...");
            // Update legacy/existing entry to ensure Link is correct
            await executeWebsiteQuery(`
                UPDATE careers SET 
                    job_title = ?, 
                    type_of_employment = ?, 
                    department = ?, 
                    location = ?, 
                    job_link = ?,  -- FORCE UPDATE LINK CORRECTLY
                    status = ?, 
                    addedBy = ?,
                    addedDate = NOW()
                WHERE id = ?
            `, [
                safeJobTitle,
                safeType,
                safeDept,
                safeLoc,
                jobLink, // Ensure this points to /candidate/jobs/[id] NOT /apply
                "active",
                userEmail,
                existingExternalJob[0].id
            ]);
        } else {
            // Check for NEW link format
            existingExternalJob = await executeWebsiteQuery(
                `SELECT id FROM careers WHERE job_link = ?`,
                [jobLink]
            ) as any[];

            if (existingExternalJob.length > 0) {
                // Update existing (normal update)
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
                    safeJobTitle,
                    safeType,
                    safeDept,
                    safeLoc,
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
                    safeJobTitle,
                    safeType,
                    safeDept,
                    safeLoc,
                    jobLink,
                    "active",
                    userEmail
                ]);
            }
        }


        // 3. Update Local DB advertisted_date
        await query(`UPDATE jobs SET advertised_date = NOW() WHERE id = ?`, [id]);

        return NextResponse.json({ success: true, message: "Job advertised successfully" });

    } catch (error: any) {
        console.error("Error advertising job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
