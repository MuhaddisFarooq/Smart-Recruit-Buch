
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

// GET /api/people/[id]/reviews
// Fetch all reviews for a specific candidate (user_id)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // This is the user_id (candidate)

        const reviews = await query(`
            SELECT r.*, u.name as reviewer_name, u.role as reviewer_role 
            FROM candidate_reviews r
            LEFT JOIN users u ON r.reviewer_id = u.id
            WHERE r.user_id = ? 
            ORDER BY r.created_at DESC
        `, [id]);

        return NextResponse.json(reviews);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/people/[id]/reviews
// Create a new review
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { rating, review_text } = body;

        if (!rating) {
            return NextResponse.json({ error: "Rating is required" }, { status: 400 });
        }

        // TODO: Get actual logged in reviewer_id if auth is implemented
        const reviewer_id = 1; // Default/Mock for now

        const result = await execute(`
            INSERT INTO candidate_reviews (user_id, reviewer_id, rating, review_text)
            VALUES (?, ?, ?, ?)
        `, [id, reviewer_id, rating, review_text]);

        return NextResponse.json({
            success: true,
            id: (result as any).insertId,
            rating,
            review_text,
            created_at: new Date()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
