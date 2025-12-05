import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rows = await query(
            `SELECT id, job_title, type_of_employment, department, location, job_link, status
       FROM careers
       WHERE status = 'active'
       ORDER BY id ASC`
        );

        return NextResponse.json(rows);
    } catch (e: any) {
        console.error("[careers:active:GET]", e);
        return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
    }
}
