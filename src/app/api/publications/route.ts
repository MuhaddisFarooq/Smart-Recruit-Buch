import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import path from "path";
import { promises as fs } from "fs";
import { saveOptimizedImage } from "../_helpers/image-processing";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}
async function ensureDir(d: string) { await fs.mkdir(d, { recursive: true }); }

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS publications (
      id INT(11) NOT NULL AUTO_INCREMENT,
      heading_name TEXT COLLATE utf8mb4_unicode_ci,
      description  TEXT COLLATE utf8mb4_unicode_ci,
      picture VARCHAR(255) COLLATE utf8mb4_unicode_ci,
      link TEXT COLLATE utf8mb4_unicode_ci,
      details TEXT COLLATE utf8mb4_unicode_ci,
      status VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
      addedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      addedDate DATETIME NOT NULL,
      updatedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NULL,
      updatedDate DATETIME NULL,
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

    const [{ cnt }] = await query<{ cnt: number }>(`SELECT COUNT(*) AS cnt FROM publications ${whereSql}`, args);
    const rows = await query<any>(
      `SELECT id, heading_name, picture, link, status
       FROM publications
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total: cnt ?? 0, page, pageSize });
  } catch (e: any) {
    console.error("[publications:GET]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** CREATE (status auto 'active') */
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const actor = await actorFromSession();

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
    }

    const fd = await req.formData();
    const heading_name = String(fd.get("heading_name") || "");
    const description  = String(fd.get("description")  || "");
    const link         = String(fd.get("link")         || "");
    const details      = String(fd.get("details")      || "");
    const file = fd.get("picture") as File | null;

    let pictureRel: string | null = null;
    if (file && file.size > 0) {
      pictureRel = await saveOptimizedImage(file, "publications", null, 98);
    }

    await query(
      `INSERT INTO publications
       (heading_name, description, picture, link, details, status, addedBy, addedDate, updatedBy, updatedDate)
       VALUES (?, ?, ?, ?, ?, 'active', ?, NOW(), NULL, NULL)`,
      [heading_name, description, pictureRel, link, details, actor]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[publications:POST]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
