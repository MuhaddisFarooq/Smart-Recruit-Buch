// src/app/api/consultants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

// normalize comma/newline separated text into newline-separated string
function normalizeList(input: unknown): string | null {
  const items = String(input ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items.join("\n") : null;
}

// split specialties -> array (we store as JSON)
function toSpecialtiesArray(input: unknown): string[] {
  return String(input ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ensure schedule is persisted as JSON string
function normalizeSchedule(input: any): string {
  // expected: { monday: [{start, end}], tuesday: [...], ... }
  // if nothing valid is passed, store an empty object
  try {
    if (input && typeof input === "object") {
      return JSON.stringify(input);
    }
  } catch {}
  return JSON.stringify({});
}

/**
 * GET /api/consultants?page=1&pageSize=10&search=
 * Returns: { data, total, page, pageSize }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)));
    const search = (searchParams.get("search") || "").trim();

    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      where.push("(c.name LIKE ? OR c.cat_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // total rows
    const totalRows = await query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM consultant c ${whereSql}`,
      params
    );
    const total = totalRows[0]?.cnt ?? 0;

    // page rows
    const rows = await query<{
      id: number;
      name: string;
      cat_name: string | null;
      profile_pic: string | null;
      status: "active" | "inactive";
    }>(
      `
      SELECT c.id, c.name, c.cat_name, c.profile_pic, c.status
      FROM consultant c
      ${whereSql}
      ORDER BY c.id ASC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (err: any) {
    console.error("[consultants:GET] DB error:", err);
    return NextResponse.json(
      { error: err?.message || "DB error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // required fields
    const required = ["consultant_id", "cat_name", "name"];
    for (const k of required) {
      if (!String(b?.[k] ?? "").trim()) {
        return NextResponse.json(
          { error: `${required.join(", ")} are required` },
          { status: 400 }
        );
      }
    }

    // who added this
    const session: Session | null = await getServerSession(authOptions);
    const addedBy =
      session?.user?.email || session?.user?.name || "system";

    // transform inputs
    const specialtiesArr = toSpecialtiesArray(b.specialties);
    const educationText = normalizeList(b.education);
    const aoeText = normalizeList(b.aoe);
    const scheduleJson = normalizeSchedule(b.schedule);

    // IMPORTANT:
    // Use an EXPLICIT column list and the SAME number of placeholders.
    //
    // Make sure your table has these columns:
    // consultant_id, cat_name, name, fee, dcd, specialties, education, aoe,
    // schedule, profile_pic, employment_status, doctor_type, status, addedBy, addedDate
    //
    // If your column is spelled "specialities" (British) instead of "specialties",
    // change the column name below to match your schema.
    const sql = `
      INSERT INTO consultant
      (
        consultant_id, cat_name, name, fee, dcd,
        specialties, education, aoe, schedule,
        profile_pic, employment_status, doctor_type,
        status, addedBy, addedDate
      )
      VALUES
      (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        'active', ?, NOW()
      )
    `;

    await query(sql, [
      String(b.consultant_id).trim(),
      String(b.cat_name).trim(),
      String(b.name).trim(),
      b.fee ?? null,
      b.dcd ?? null,

      JSON.stringify(specialtiesArr), // store array as JSON
      educationText,
      aoeText,
      scheduleJson,                   // store schedule as JSON

      String(b.profile_pic ?? ""),
      String(b.employment_status ?? ""),
      String(b.doctor_type ?? ""),

      addedBy,
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[consultants:POST] DB error:", err);
    return NextResponse.json(
      { error: err?.message || "DB error" },
      { status: 500 }
    );
  }
}
