import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rows = await query(
            `SELECT id, patient_name, details, video_link, status
       FROM testimonials
       WHERE status = 'active'
       ORDER BY id DESC`
        );

        return NextResponse.json(rows);
    } catch (e: any) {
        console.error("[testimonials:active:GET]", e);
        return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
    }
}
