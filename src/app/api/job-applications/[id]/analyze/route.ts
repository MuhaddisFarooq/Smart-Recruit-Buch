
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { calculateScore } from "@/lib/scoring";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolution = await params;
        const applicationId = resolution.id;

        // 1. Fetch Application & Candidate Data
        const appRes = await query(`
            SELECT ja.user_id, ja.job_id, u.name, u.email
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            WHERE ja.id = ?
        `, [applicationId]);

        if (appRes.length === 0) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }
        const app = appRes[0];

        // Fetch Experience & Education
        const experience = await query("SELECT * FROM candidate_experience WHERE user_id = ?", [app.user_id]);
        const education = await query("SELECT * FROM candidate_education WHERE user_id = ?", [app.user_id]);

        // Current Title (from latest experience or user profile if we had it there)
        const currentTitle = experience[0]?.title || "Candidate";

        const candidate = {
            title: currentTitle,
            experience,
            education,
            resume_text: "" // TODO: Implement resume parsing text retrieval
        };

        // 2. Fetch Job Data
        const jobRes = await query(`
            SELECT job_title, description, qualifications, experience_level
            FROM jobs WHERE id = ?
        `, [app.job_id]);

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

        // 3. Calculate Score
        const score = calculateScore(job, candidate);

        // 4. Update DB
        await execute("UPDATE job_applications SET score = ? WHERE id = ?", [score, applicationId]);

        return NextResponse.json({ success: true, score });
    } catch (error: any) {
        console.error("Scoring error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
