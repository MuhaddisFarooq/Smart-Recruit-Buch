import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rows = await query(
            `SELECT id, title, price_label, image, status, consultations, cardiology_tests, radiology_tests, lab_tests, instructions
       FROM executive_health_checkups
       WHERE status = 'active'
       ORDER BY id DESC`
        );

        return NextResponse.json(rows);
    } catch (e: any) {
        console.error("[ehc:active:GET]", e);
        return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
    }
}
