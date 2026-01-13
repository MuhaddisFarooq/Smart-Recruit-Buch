import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q");

        if (!q || q.length < 2) {
            return NextResponse.json([]);
        }

        // Search for candidates by name in users table joined with job_applications
        // We limit results to 5 for the dropdown
        const results = await query(
            `SELECT 
                ja.id as application_id,
                u.id as user_id,
                u.name,
                u.email,
                j.job_title,
                ja.status
             FROM job_applications ja
             JOIN users u ON ja.user_id = u.id
             JOIN jobs j ON ja.job_id = j.id
             WHERE u.name LIKE ? OR u.email LIKE ?
             ORDER BY ja.applied_at DESC
             LIMIT 5`,
            [`%${q}%`, `%${q}%`]
        );

        return NextResponse.json(results);
    } catch (error: any) {
        console.error("Search error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
