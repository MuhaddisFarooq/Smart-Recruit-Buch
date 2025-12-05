import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rows = await query(
            `SELECT
        c.id,
        c.cat_name,
        c.main_cat_id,
        c.cat_description,
        c.cat_img,
        m.cat_name AS main_cat_name
      FROM consultant_category c
      LEFT JOIN consultant_main_category m ON m.id = c.main_cat_id
      ORDER BY c.id ASC`
        );

        return NextResponse.json(rows);
    } catch (e: any) {
        console.error("[consultant-categories:GET]", e);
        return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
    }
}
