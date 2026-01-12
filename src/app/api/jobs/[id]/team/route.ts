import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";

// GET /api/jobs/[id]/team - List team members
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const team = await query(`
            SELECT t.id, t.user_id, t.role, u.name, u.email, u.avatar_url
            FROM job_hiring_team t
            JOIN users u ON t.user_id = u.id
            WHERE t.job_id = ?
            ORDER BY t.created_at ASC
        `, [id]);
        return NextResponse.json(team);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/jobs/[id]/team - Add member
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const { user_id, role } = body;

        await execute(`
            INSERT INTO job_hiring_team (job_id, user_id, role)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE role = VALUES(role)
        `, [id, user_id, role]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        // Handle unique constraint error gracefully if needed, but ON DUPLICATE handles it
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/jobs/[id]/team - Update member role
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const { user_id, role } = body;

        await execute(`
            UPDATE job_hiring_team 
            SET role = ? 
            WHERE job_id = ? AND user_id = ?
        `, [role, id, user_id]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/jobs/[id]/team?user_id=123 - Remove member
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const user_id = searchParams.get("user_id");

    if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

    try {
        await execute(`
            DELETE FROM job_hiring_team 
            WHERE job_id = ? AND user_id = ?
        `, [id, user_id]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
