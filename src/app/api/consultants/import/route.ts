// src/app/api/consultants/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ✅ Node APIs needed (xlsx, mysql2, Buffer)

// Helpers
function normalizeList(input: unknown): string | null {
  const items = String(input ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items.join("\n") : null;
}
function toSpecialtiesArray(input: unknown): string[] {
  return String(input ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function normalizeSchedule(input: any): string {
  try {
    if (input && typeof input === "object") return JSON.stringify(input);
  } catch {}
  return JSON.stringify({});
}

let _xlsx: any;
async function getXLSX() {
  if (!_xlsx) _xlsx = await import("xlsx");
  return _xlsx;
}

export async function POST(req: NextRequest) {
  try {
    // 🔒 Require "new"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "consultants", "new")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actorEmail = session.user?.email || session.user?.name || "import";

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded (field name must be 'file')." },
        { status: 400 }
      );
    }

    const XLSX = await getXLSX();
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });

    const sheetName =
      wb.SheetNames.find((n: string) => n.toLowerCase() === "consultants") ||
      wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) return NextResponse.json({ error: "No worksheet found." }, { status: 400 });

    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
    if (!rows.length) {
      return NextResponse.json({ error: "The worksheet is empty." }, { status: 400 });
    }

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

    let inserted = 0;

    for (const r of rows) {
      const consultant_id = String(r.consultant_id ?? r.CONSULTANT_ID ?? "").trim();
      const name = String(r.name ?? r.NAME ?? "").trim();
      const cat_name = String(r.category ?? r.CATEGORY ?? "").trim();
      if (!consultant_id || !name || !cat_name) continue;

      const fee =
        r.fee !== "" && r.fee !== null && r.fee !== undefined ? Number(r.fee) : null;
      const dcd = String(r.dcd ?? "").trim() || null;

      const specialtiesArr = toSpecialtiesArray(r.specialties);
      const educationText = normalizeList(r.education);
      const aoeText = normalizeList(r.aoe);

      const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
      const scheduleObj: Record<string, { start: string; end: string }[]> = {};
      for (const d of days) {
        const ms = String(r[`${d}_morning_start`] ?? "").trim();
        const me = String(r[`${d}_morning_end`] ?? "").trim();
        const es = String(r[`${d}_evening_start`] ?? "").trim();
        const ee = String(r[`${d}_evening_end`] ?? "").trim();
        const slots: { start: string; end: string }[] = [];
        if (ms || me) slots.push({ start: ms || "", end: me || ms || "" });
        if (es || ee) slots.push({ start: es || "", end: ee || es || "" });
        scheduleObj[d] = slots;
      }

      const employment_status = String(r.employment_status ?? "").trim();
      const isSurgeon =
        String(r.is_surgeon ?? "").toLowerCase() === "true" ||
        String(r.is_surgeon ?? "").toLowerCase() === "1";
      const doctor_type = isSurgeon ? "Surgeon" : "";

      const profile_pic = String(r.profile_pic ?? "").trim();

      await query(sql, [
        consultant_id,
        cat_name,
        name,
        fee,
        dcd,
        JSON.stringify(specialtiesArr),
        educationText,
        aoeText,
        JSON.stringify(scheduleObj),
        profile_pic,
        employment_status,
        doctor_type,
        actorEmail,
      ]);

      inserted++;
    }

    return NextResponse.json({ ok: true, inserted });
  } catch (err: any) {
    console.error("[consultants:import:POST] error:", err);
    return NextResponse.json({ error: err?.message || "Import failed" }, { status: 500 });
  }
}
