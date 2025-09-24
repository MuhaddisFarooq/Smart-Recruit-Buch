import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}
async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}
async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INT(11) NOT NULL AUTO_INCREMENT,
      image TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      addedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      addedDate DATETIME NOT NULL,
      updatedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NULL,
      updatedDate DATETIME NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/** GET all (latest first) */
export async function GET() {
  try {
    await ensureTable();
    const rows = await query<{ id: number; image: string; addedBy: string; addedDate: any }>(
      `SELECT id, image, addedBy, addedDate
       FROM achievements
       ORDER BY id DESC`
    );
    return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error("[achievements:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

/** POST multipart/form-data with "image" */
export async function POST(req: NextRequest) {
  try {
    await ensureTable();

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const arr = await file.arrayBuffer();
    const input = Buffer.from(arr as ArrayBuffer);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "achievements");
    await ensureDir(uploadsDir);

    const base = sanitizeName(file.name || "image.jpg");
    const outName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}`.replace(
      /\.(png|webp|gif|bmp|tiff)$/i,
      ".jpg"
    );
    const absOut = path.join(uploadsDir, outName);

    // compress → jpg (usually KBs)
    await sharp(input)
      .rotate()
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toFile(absOut);

    const rel = `achievements/${outName}`;
    const actor = await actorFromSession();

    await query(
      `INSERT INTO achievements (image, addedBy, addedDate, updatedBy, updatedDate)
       VALUES (?, ?, NOW(), ?, NOW())`,
      [rel, actor, actor]
    );

    return NextResponse.json({ ok: true, image: `/uploads/${rel}` });
  } catch (err: any) {
    console.error("[achievements:POST] error:", err);
    return NextResponse.json({ error: err?.message || "Failed to save" }, { status: 500 });
  }
}
