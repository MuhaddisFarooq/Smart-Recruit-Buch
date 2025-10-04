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
  const folder = path.join(process.cwd(), "public", "uploads", "hr-training");
  await ensureDir(folder);
  const base = sanitize(file.name || "training.jpg").replace(/\.(png|webp|gif|bmp|tiff)$/i, ".jpg");
  const out = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${base}`;
  const abs = path.join(folder, out);
  await sharp(buf).rotate().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(abs);
  return `hr-training/${out}`; // /uploads/hr-training/<file>
}

// Normalize comma/newline lists -> newline-separated, trimmed unique items
function normalizeMulti(input: unknown): string {
  const items = String(input ?? "")
    .split(/[\n,]+/g)
    .map(s => s.trim())
    .filter(Boolean);
  return items.join("\n");
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS hr_trainings (
      id INT(11) NOT NULL AUTO_INCREMENT,
      title        TEXT,
      date         DATE,
      time         VARCHAR(20),
      duration     VARCHAR(50),
      trainer      TEXT,
      participants TEXT,
      t_agenda     MEDIUMTEXT,     -- HTML from CKEditor
      image        VARCHAR(255),
      department   VARCHAR(100),
      t_type       VARCHAR(50),
      t_certificate VARCHAR(20),
      addedBy      VARCHAR(100) NOT NULL,
      addedDate    DATETIME NOT NULL,
      updatedBy    VARCHAR(100) NULL,
      updatedDate  DATETIME NULL,
      PRIMARY KEY (id),
      KEY idx_date (date),
      KEY idx_department (department)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/** GET /api/hr-training?page=&pageSize=&search= */
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
      where.push("(title LIKE ? OR department LIKE ? OR trainer LIKE ?)");
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [{ cnt = 0 } = {}] = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM hr_trainings ${whereSql}`, args
    );
    const rows = await query<any>(
      `SELECT id, title, date, time, duration, trainer, participants, t_agenda, image, department, t_type, t_certificate
       FROM hr_trainings
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total: cnt, page, pageSize });
  } catch (e: any) {
    console.error("[hr-training:GET]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** POST /api/hr-training  (multipart/form-data) */
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const actor = await actorFromSession();

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
    }

    const fd = await req.formData();

    const title        = String(fd.get("title") || "").trim();
    const dateStr      = String(fd.get("date") || "").trim();  // yyyy-mm-dd
    const time         = String(fd.get("time") || "").trim();
    const duration     = String(fd.get("duration") || "").trim();
    const trainer      = normalizeMulti(fd.get("trainer"));
    const participants = normalizeMulti(fd.get("participants"));
    const t_agenda     = String(fd.get("t_agenda") ?? "");      // HTML intact
    const department   = String(fd.get("department") || "").trim();
    const t_type       = String(fd.get("t_type") || "").trim();
    const t_certificate= String(fd.get("t_certificate") || "").trim();

    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

    // optional image
    let relImage: string | null = null;
    const file = fd.get("image") as File | null;
    if (file && file.size > 0) relImage = await saveCompressedJpeg(file);

    const date = dateStr ? new Date(dateStr) : null;

    await query(
      `INSERT INTO hr_trainings
       (title, date, time, duration, trainer, participants, t_agenda, image, department, t_type, t_certificate, addedBy, addedDate, updatedBy, updatedDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)`,
      [title, date, time, duration, trainer, participants, t_agenda, relImage, department, t_type, t_certificate, actor]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[hr-training:POST]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
