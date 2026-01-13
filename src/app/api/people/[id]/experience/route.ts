import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { execute } from "@/lib/db";
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

        const { id } = await params; // This is the user_id of the candidate
        const body = await req.json();
        const { title, company, location, description, start_date, end_date, is_current } = body;

        if (!title || !company) {
            return NextResponse.json({ error: "Title and Company are required" }, { status: 400 });
        }

        await execute(
            `INSERT INTO candidate_experience 
            (user_id, title, company, location, description, start_date, end_date, is_current) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title, company, location, description, start_date || null, end_date || null, is_current ? 1 : 0]
        );

        return NextResponse.json({ success: true, message: "Experience added" });
    } catch (error: any) {
        console.error("Error adding experience:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
