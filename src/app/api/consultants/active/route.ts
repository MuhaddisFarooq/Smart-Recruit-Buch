import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const isFeatured = searchParams.get("is_featured");

        const where: string[] = ["c.status = 'active'"];
        const args: any[] = [];

        if (isFeatured === "1" || isFeatured === "true") {
            where.push("c.is_featured = 1");
        }

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
        c.consultant_type,
        c.is_featured
      FROM consultant c
      WHERE ${where.join(" AND ")}
      ORDER BY c.id ASC`,
            args
        );

        return NextResponse.json(rows);
    } catch (e: any) {
        console.error("[consultants:active:GET]", e);
        return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
    }
}
