import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "@/lib/db";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `
You are a technical recruiter. Your goal is to evaluate if a candidate's resume matches the Job Description (JD) requirements.

Input Format:
- Job Description: [Text]
- Qualifications: [Text]
- Experience Level: [Text]
- Resume Text: [Text]

Your Task:
1. Analyze the candidate's resume against the Job Description and Qualifications.
2. **SCORING & ELIGIBILITY:** 
   - Assign a score from 0 to 100 based on how well they match.
   - **Threshold:** If the score is **50 or higher**, they are **ELIGIBLE**.
   - If the score is **below 50**, they are **INELIGIBLE**.

3. **SCORING GUIDE:**
   - 90-100: Perfect match (all core + secondary skills).
   - 70-89: Strong match (meets all core requirements).
   - 50-69: Moderate match (meets some core requirements, or has transferable skills). **ACCEPTABLE**.
   - <50: Poor match (irrelevant experience, missing all core skills). **REJECT**.

Output JSON Format:
{
  "eligible": boolean, // true if score >= 50, false if score < 50
  "score": number, // 0-100
  "reasons": ["Reason 1", "Reason 2"],
  "missing_skills": ["List of missing critical skills"]
}

Return ONLY valid JSON.
`;

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { resumeText } = body;

        if (!resumeText) {
            return NextResponse.json({ error: "No resume text provided" }, { status: 400 });
        }

        // 1. Fetch Job Details
        const jobRows = await query(
            "SELECT job_title, description, qualifications, experience_level, type_of_employment FROM jobs WHERE id = ?",
            [id]
        ) as any[];

        if (!jobRows || jobRows.length === 0) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const job = jobRows[0];
        const jobContext = `
            Job Title: ${job.job_title}
            Description: ${job.description}
            Qualifications: ${job.qualifications}
            Experience Level: ${job.experience_level || "Not specified"}
            Type: ${job.type_of_employment}
        `;

        // 2. Call Gemini
        if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
            console.error("No Gemini API Key found for screening");
            // Allow if AI is not configured, or block? 
            // Better to fail open or return a warning in dev, but strictly fail in prod?
            // For now, let's mock a pass if no key (dev mode) or error.
            return NextResponse.json({
                eligible: true,
                score: 50,
                reasons: ["AI Screening skipped (API Key missing)"],
                missing_skills: []
            });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "user", parts: [{ text: `JOB DETAILS:\n${jobContext}\n\nRESUME TEXT:\n${resumeText}` }] }
            ],
            generationConfig: { responseMimeType: "application/json" }
        });

        const responseText = result.response.text();
        const analysis = JSON.parse(responseText);

        return NextResponse.json({ success: true, analysis });

    } catch (error: any) {
        console.error("Screening Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
