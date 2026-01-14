
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

// GET /api/job-applications/[id]/panel - Get panel members
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        const members = await query(`
            SELECT 
                ip.id,
                ip.user_id,
                ip.role,
                u.name,
                u.email,
                u.avatar_url
            FROM interview_panels ip
            JOIN users u ON ip.user_id = u.id
            WHERE ip.application_id = ?
        `, [id]);

        return NextResponse.json(members);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/job-applications/[id]/panel - Add panel member
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { user_id, role } = body;

        if (!user_id || !role) {
            return NextResponse.json({ error: "User and role are required" }, { status: 400 });
        }

        // Check if already exists
        const existing = await query(
            "SELECT id FROM interview_panels WHERE application_id = ? AND user_id = ?",
            [id, user_id]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "User already in panel" }, { status: 400 });
        }

        await execute(
            "INSERT INTO interview_panels (application_id, user_id, role) VALUES (?, ?, ?)",
            [id, user_id, role]
        );

        return NextResponse.json({ success: true, message: "Added to panel" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/job-applications/[id]/panel - Remove panel member
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get("user_id");

        if (!user_id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const { id } = await params;

        await execute(
            "DELETE FROM interview_panels WHERE application_id = ? AND user_id = ?",
            [id, user_id]
        );

        return NextResponse.json({ success: true, message: "Removed from panel" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
