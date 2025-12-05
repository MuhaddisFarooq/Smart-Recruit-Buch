import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rows = await query(
            `SELECT
        p.id,
        p.test_name,
        p.price,
        p.department,
        p.status
      FROM pathology p
      WHERE p.status = 'active'
      ORDER BY p.id DESC`
        );

        return NextResponse.json(rows);
    } catch (e: any) {
        console.error("[pathology:active:GET]", e);
        return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
    }
}
