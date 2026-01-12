import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const users = await query(`
            SELECT id, name, email, avatar_url 
            FROM users 
            WHERE name LIKE ? OR email LIKE ?
            LIMIT 5
        `, [`%${q}%`, `%${q}%`]);

        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
