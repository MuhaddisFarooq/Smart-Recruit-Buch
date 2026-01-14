
import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) { // Add admin check here later
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            firstName, lastName, email, phone, location, website,
            source, sourceType, tags, notes, photoUrl, resumeUrl,
            jobId, experience, education
        } = body;

        if (!email || !jobId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Find or Create User
        let userId;
        const existingUser = await query("SELECT id FROM users WHERE email = ?", [email]);

        if (Array.isArray(existingUser) && existingUser.length > 0) {
            userId = (existingUser[0] as any).id;
            // Update existing user info if needed
            await execute(`
                UPDATE users SET 
                name = ?, phone = ?, city = ?, 
                resume_url = COALESCE(?, resume_url),
                linkedin_url = COALESCE(?, linkedin_url),
                avatar_url = COALESCE(?, avatar_url)
                WHERE id = ?
            `, [
                `${firstName} ${lastName}`,
                phone || null,
                location || null,
                resumeUrl || null,
                website || null,
                photoUrl || null,
                userId
            ]);
        } else {
            // Create New User
            // Generate default password hash (Buch2026)
            const dummyHash = await bcrypt.hash("Buch2026", 10);
            const result = await execute(`
                INSERT INTO users (name, email, password, phone, city, resume_url, linkedin_url, avatar_url, role)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'candidate')
            `, [
                `${firstName} ${lastName}`,
                email,
                dummyHash,
                phone || null,
                location || null,
                resumeUrl || null,
                website || null,
                photoUrl || null
            ]);
            userId = (result as any).insertId;
        }

        // 2. Create Job Application
        // Check if already applied
        const existingApp = await query("SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?", [jobId, userId]);
        if (Array.isArray(existingApp) && existingApp.length > 0) {
            return NextResponse.json({ error: "Candidate has already applied to this job" }, { status: 400 });
        }

        await execute(`
            INSERT INTO job_applications (
                job_id, user_id, first_name, last_name, email, phone, 
                resume_path, source, source_type, tags, notes, status, applied_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', NOW())
        `, [
            jobId, userId, firstName, lastName, email, phone || null,
            resumeUrl || null, source || null, sourceType || null,
            JSON.stringify(tags || []), notes || null
        ]);

        // 3. Sync Experience
        // Verify this deletes OLD experience - ideally we only append or be careful not to wipe if it's an existing user applying to a SECOND job.
        // For now, assuming "latest is greatest" for the profile.
        await execute("DELETE FROM candidate_experience WHERE user_id = ?", [userId]);
        if (Array.isArray(experience)) {
            for (const exp of experience) {
                await execute(`
                    INSERT INTO candidate_experience (user_id, title, company, location, description, start_date, end_date, is_current)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userId, exp.title, exp.company, exp.location, exp.description,
                    exp.startDate ? new Date(exp.startDate) : null,
                    exp.endDate ? new Date(exp.endDate) : null,
                    exp.current ? 1 : 0
                ]);
            }
        }

        // 4. Sync Education
        await execute("DELETE FROM candidate_education WHERE user_id = ?", [userId]);
        if (Array.isArray(education)) {
            for (const edu of education) {
                await execute(`
                    INSERT INTO candidate_education (user_id, institution, major, degree, description, start_date, end_date, is_current)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    userId, edu.school, edu.field, edu.degree, edu.description,
                    edu.startDate ? new Date(edu.startDate) : null,
                    edu.endDate ? new Date(edu.endDate) : null,
                    edu.current ? 1 : 0
                ]);
            }
        }

        return NextResponse.json({ success: true, userId });

    } catch (error: any) {
        console.error("Add candidate error:", error);
        return NextResponse.json({ error: error.message || "Failed to add candidate" }, { status: 500 });
    }
}
