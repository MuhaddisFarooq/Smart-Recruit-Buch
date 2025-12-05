import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const rows = await query(
            `SELECT
        c.id,
        c.consultant_id,
        c.name,
        c.cat_name,
        c.profile_pic,
        c.status,
        c.fee,
        c.employment_status,
        c.specialties,
        c.education,
        c.aoe,
        c.experience,
        c.schedule,
        c.background_image,
        c.doctor_type,
        c.consultant_type
      FROM consultant c
      WHERE c.status = 'active'
      ORDER BY c.id ASC`
        );

        return NextResponse.json(rows);
    } catch (e: any) {
        console.error("[consultants:active:GET]", e);
        return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
    }
}
