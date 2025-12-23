import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Public API for fetching active management team members.
 * Used by external frontends (e.g., corf-react).
 */
export async function GET() {
    try {
        const rows = await query(`
      SELECT id, name, designation, photo
      FROM management_team
      WHERE status = 'active'
      ORDER BY id DESC
    `);

        return NextResponse.json(rows);
    } catch (err: any) {
        console.error("[management/active:GET] DB error:", err);
        return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
    }
}
