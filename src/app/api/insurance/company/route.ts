// src/app/api/insurance/company/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { actorFromSession, saveCompressedJpeg } from "../_helpers";

export const dynamic = "force-dynamic";

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS insurance_company (
      id INT(11) NOT NULL AUTO_INCREMENT,
      name TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      profile TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      address TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      logo TEXT COLLATE utf8mb4_unicode_ci NULL,
      addedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      addedDate DATETIME NOT NULL,
      updatedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NULL,
      updatedDate DATETIME NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)));
    const search = (searchParams.get("search") || "").trim();

    const where: string[] = [];
    const params: any[] = [];
    if (search) {
      where.push("(name LIKE ? OR address LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRows = await query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM insurance_company ${whereSql}`,
      params
    );
    const total = totalRows[0]?.cnt ?? 0;

    const rows = await query<{
      id: number; name: string; profile: string; address: string; logo: string | null;
      addedBy?: string; addedDate?: any; updatedBy?: string | null; updatedDate?: any | null;
    }>(
      `
      SELECT id, name, profile, address, logo, addedBy, addedDate, updatedBy, updatedDate
      FROM insurance_company
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (err: any) {
    console.error("[insurance_company:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    const profile = String(form.get("profile") || "").trim();
    const address = String(form.get("address") || "").trim();
    const logoFile = form.get("logo") as File | null;

    if (!name || !profile || !address) {
      return NextResponse.json({ error: "name, profile, address are required" }, { status: 400 });
    }

    const addedBy = await actorFromSession();
    const now = new Date();
    const storedLogo = logoFile ? await saveCompressedJpeg(logoFile, "company") : null;

    await query(
      `INSERT INTO insurance_company
       (name, profile, address, logo, addedBy, addedDate, updatedBy, updatedDate)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)`,
      [name, profile, address, storedLogo, addedBy, now]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[insurance_company:POST] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
