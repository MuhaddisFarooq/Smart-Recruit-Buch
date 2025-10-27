import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ensureDir(d: string) { await fs.mkdir(d, { recursive: true }); }
function rand() { return crypto.randomBytes(8).toString("hex"); }
function sanitize(n: string) { return n.replace(/[^a-zA-Z0-9._-]+/g, "_"); }

async function actor() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}

async function saveUploadedFile(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const folder = path.join(process.cwd(), "public", "uploads", "blogs");
  await ensureDir(folder);
  const out = `${Date.now()}_${rand()}_${sanitize(file.name || "file")}`;
  await fs.writeFile(path.join(folder, out), buf);
  return `blogs/${out}`; // relative under /public/uploads
}

/** GET list with pagination & search */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)));
    const search = (searchParams.get("search") || "").trim();

    const where: string[] = [];
    const args: any[] = [];
    if (search) { where.push("title LIKE ?"); args.push(`%${search}%`); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRows = await query<{ cnt: number }>(`SELECT COUNT(*) AS cnt FROM blogs ${whereSql}`, args);
    const total = totalRows[0]?.cnt ?? 0;

    const rows = await query<any>(
      `SELECT id, title, category, featured_post, file_path, addedBy, addedDate
       FROM blogs
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (e: any) {
    console.error("[blogs:GET]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** POST create (JSON or multipart) */
export async function POST(req: NextRequest) {
  try {
    const who = await actor();
    const now = new Date();

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let title = "";
    let category = "";
    let description_html = "";
    let featured_post = 0;
    let fileRel: string | null = null;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      title            = String(fd.get("title") || "");
      category         = String(fd.get("category") || "");
      description_html = String(fd.get("description_html") || "");
      featured_post    = String(fd.get("featured_post") || "") === "1" ? 1 : 0;
      const file = fd.get("file") as File | null;
      if (file && file.size > 0) fileRel = await saveUploadedFile(file);
    } else {
      const b: any = await req.json().catch(() => ({}));
      title            = String(b.title || "");
      category         = String(b.category || "");
      description_html = String(b.description_html || "");
      featured_post    = Number(b.featured_post) ? 1 : 0;
      // (no file in JSON mode)
    }

    if (!title.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const res = await execute(
      `INSERT INTO blogs
        (title, category, description_html, file_path, featured_post, addedBy, addedDate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), category.trim() || null, description_html, fileRel, featured_post, who, now]
    );

    return NextResponse.json({ ok: true, id: res.insertId });
  } catch (e: any) {
    console.error("[blogs:POST]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
