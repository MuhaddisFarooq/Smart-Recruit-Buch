import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import path from "path";
import { promises as fs } from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { saveOptimizedImage } from "../_helpers/image-processing";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS clinical_study (
      id INT(11) NOT NULL AUTO_INCREMENT,
      heading_name TEXT COLLATE utf8mb4_unicode_ci,
      description  TEXT COLLATE utf8mb4_unicode_ci,
      picture      VARCHAR(255) COLLATE utf8mb4_unicode_ci,
      link         TEXT COLLATE utf8mb4_unicode_ci,
      details      TEXT COLLATE utf8mb4_unicode_ci,
      status       VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
      addedBy      VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      addedDate    DATETIME NOT NULL,
      updatedBy    VARCHAR(100) COLLATE utf8mb4_unicode_ci NULL,
      updatedDate  DATETIME NULL,
      PRIMARY KEY (id),
      KEY idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/** LIST */
export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, Number(sp.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") || 10)));
    const search = (sp.get("search") || "").trim();

    const where: string[] = [];
    const args: any[] = [];
    if (search) {
      where.push("(heading_name LIKE ? OR description LIKE ?)");
      args.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRows = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM clinical_study ${whereSql}`, args
    );
    const total = totalRows[0]?.cnt ?? 0;

    const rows = await query<any>(
      `SELECT id, heading_name, picture, link, status
         FROM clinical_study
         ${whereSql}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (e: any) {
    console.error("[clinical:GET]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** CREATE — status always 'active' */
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const actor = await actorFromSession();

    if (!(req.headers.get("content-type") || "").toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
    }

    const fd = await req.formData();
    const heading_name = String(fd.get("heading_name") || "").trim();
    const description  = String(fd.get("description")  || "").trim();
    const link         = String(fd.get("link")         || "").trim();
    const details      = String(fd.get("details")      || "").trim();
    const file = fd.get("image") as File | null;

    if (!heading_name) return NextResponse.json({ error: "heading_name is required." }, { status: 400 });

    let picture: string | null = null;
    if (file && file.size > 0) picture = await saveOptimizedImage(file, "clinical", null, 98);

    // Force status to 'active' on creation
    await query(
      `INSERT INTO clinical_study (heading_name, description, picture, link, details, status, addedBy, addedDate, updatedBy, updatedDate)
       VALUES (?, ?, ?, ?, ?, 'active', ?, NOW(), NULL, NULL)`,
      [heading_name, description, picture, link, details, actor]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[clinical:POST]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
