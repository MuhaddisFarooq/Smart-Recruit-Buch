import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";

export async function GET() {
    try {
        // Active Jobs: status in 'active', 'published', 'public', 'open'
        const activeJobsResult = await query(`
            SELECT COUNT(*) as count 
            FROM jobs 
            WHERE LOWER(status) IN ('active', 'published', 'public', 'open')
        `);
        const activeJobs = activeJobsResult[0]?.count || 0;

        // Total Candidates: unique applicants
        const totalCandidatesResult = await query(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM job_applications
        `);
        const totalCandidates = totalCandidatesResult[0]?.count || 0;

        // New Candidates: applications with status 'new'
        const newCandidatesResult = await query(`
            SELECT COUNT(*) as count 
            FROM job_applications 
            WHERE status = 'new'
        `);
        const newCandidates = newCandidatesResult[0]?.count || 0;

        return NextResponse.json({
            activeJobs,
            totalCandidates,
            newCandidates
        });
    } catch (error: any) {
        console.error("Stats fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
