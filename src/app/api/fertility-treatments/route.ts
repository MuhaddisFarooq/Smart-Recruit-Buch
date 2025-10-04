// src/app/api/fertility-treatments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}
async function ensureDir(d: string) { await fs.mkdir(d, { recursive: true }); }
function sanitize(n: string) { return n.replace(/[^a-zA-Z0-9._-]+/g, "_"); }

async function saveCompressedJpeg(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const folder = path.join(process.cwd(), "public", "uploads", "fertility");
  await ensureDir(folder);
  const base = sanitize(file.name || "image.jpg").replace(/\.(png|webp|gif|bmp|tiff)$/i, ".jpg");
  const out = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}`;
  const abs = path.join(folder, out);
  await sharp(buf).rotate().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(abs);
  return `fertility/${out}`; // will be served as /uploads/fertility/...
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS fertility_treatments (
      id INT(11) NOT NULL AUTO_INCREMENT,
      title TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      details TEXT COLLATE utf8mb4_unicode_ci,
      image VARCHAR(255) COLLATE utf8mb4_unicode_ci,
      description_html MEDIUMTEXT COLLATE utf8mb4_unicode_ci,
      addedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      addedDate DATETIME NOT NULL,
      updatedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NULL,
      updatedDate DATETIME NULL,
      PRIMARY KEY (id),
      KEY idx_addedDate (addedDate)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/** List with pagination + search (title/details) */
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
      where.push("(title LIKE ? OR details LIKE ?)");
      args.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRows = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM fertility_treatments ${whereSql}`, args
    );
    const total = totalRows[0]?.cnt ?? 0;

    const rows = await query<any>(
      `SELECT id, title, details, image, addedDate
         FROM fertility_treatments
         ${whereSql}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (e: any) {
    console.error("[fertility:GET]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** Create (multipart/form-data) */
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const actor = await actorFromSession();

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
    }

    const fd = await req.formData();
    const title = String(fd.get("title") || "").trim();
    const details = String(fd.get("details") || "").trim();
    const description_html = String(fd.get("description_html") || "").trim();
    const file = fd.get("image") as File | null;

    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

    let imageRel: string | null = null;
    if (file && file.size > 0) imageRel = await saveCompressedJpeg(file);

    await query(
      `INSERT INTO fertility_treatments
        (title, details, image, description_html, addedBy, addedDate, updatedBy, updatedDate)
       VALUES (?, ?, ?, ?, ?, NOW(), NULL, NULL)`,
      [title, details || null, imageRel, description_html || null, actor]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[fertility:POST]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
