import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rows = await query(
            `SELECT id, title, category, featured_post, file_path, addedDate
       FROM blogs
       ORDER BY id DESC
       LIMIT 10`
        );

        return NextResponse.json(rows);
    } catch (e: any) {
        console.error("[blogs:active:GET]", e);
        return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
    }
}
