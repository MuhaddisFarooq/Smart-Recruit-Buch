import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const now = new Date();

        const rows = await query(
            `SELECT id, image, start_date, end_date, status
       FROM sliders
       WHERE status = 'active'
       AND start_date <= ?
       AND end_date >= ?
       ORDER BY id DESC`,
            [now, now]
        );

        return NextResponse.json(rows);
    } catch (e: any) {
        console.error("[sliders:active:GET]", e);
        return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
    }
}
