
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

// GET /api/people/[id]/notes
// Fetch all notes for a specific candidate (user_id)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // This is the user_id (candidate)

        const notes = await query(`
            SELECT n.*, u.name as author_name, u.role as author_role 
            FROM candidate_notes n
            LEFT JOIN users u ON n.author_id = u.id
            WHERE n.user_id = ? 
            ORDER BY n.created_at DESC
        `, [id]);

        return NextResponse.json(notes);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/people/[id]/notes
// Create a new note
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { note_text } = body;

        if (!note_text) {
            return NextResponse.json({ error: "Note text is required" }, { status: 400 });
        }

        // TODO: Get actual logged in author_id if auth is implemented
        const author_id = 1; // Default/Mock for now (Admin)

        const result = await execute(`
            INSERT INTO candidate_notes (user_id, author_id, note_text)
            VALUES (?, ?, ?)
        `, [id, author_id, note_text]);

        return NextResponse.json({
            success: true,
            id: (result as any).insertId,
            note_text,
            created_at: new Date()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
