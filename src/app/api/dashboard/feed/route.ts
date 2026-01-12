import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        // 1. Fetch Hired Candidates
        const hiredRows = await query(`
            SELECT 
                ja.id,
                u.name as personName,
                j.job_title as jobTitle,
                j.city, 
                j.country,
                ja.updated_at as date,
                COALESCE(hm_u.name, 'Hiring Team') as hiredBy
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            JOIN jobs j ON ja.job_id = j.id
            LEFT JOIN job_hiring_team jht ON j.id = jht.job_id AND jht.role = 'Hiring Manager'
            LEFT JOIN users hm_u ON jht.user_id = hm_u.id
            WHERE ja.status = 'hired'
            ORDER BY ja.updated_at DESC
            LIMIT 4
        `);

        // 2. Fetch Team Posts
        const postRows = await query(`
            SELECT 
                tp.id,
                tp.content,
                tp.created_at as date,
                u.name as authorName,
                u.email as authorEmail
            FROM team_posts tp
            JOIN users u ON tp.user_id = u.id
            ORDER BY tp.created_at DESC
            LIMIT 4
        `);

        // 3. Normalize and Combine
        const hiredItems = (hiredRows as any[]).map(row => ({
            id: `hired-${row.id}`,
            type: 'hired',
            personName: row.personName,
            hiredBy: row.hiredBy,
            startDate: new Date(row.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            jobTitle: row.jobTitle,
            location: `${row.city}, ${row.country}`,
            dateRaw: new Date(row.date).getTime(),
            date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            avatarUrl: null
        }));

        const postItems = (postRows as any[]).map(row => ({
            id: `post-${row.id}`,
            type: 'post',
            content: row.content,
            authorName: row.authorName,
            dateRaw: new Date(row.date).getTime(),
            date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            avatarUrl: null // Could fetch or use placeholder
        }));

        // 4. Sort and Limit
        const feedItems = [...hiredItems, ...postItems]
            .sort((a, b) => b.dateRaw - a.dateRaw)
            .slice(0, 4);

        return NextResponse.json(feedItems);
    } catch (error: any) {
        console.error("Feed API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any)?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { content } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const userId = (session.user as any).id;

        await execute(
            "INSERT INTO team_posts (user_id, content) VALUES (?, ?)",
            [userId, content]
        );

        return NextResponse.json({ message: "Post created" });
    } catch (error: any) {
        console.error("Feed Post Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
