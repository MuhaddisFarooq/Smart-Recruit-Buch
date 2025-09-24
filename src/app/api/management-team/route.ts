// src/app/api/management-team/route.ts
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

export async function GET() {
  try {
    const rows = await query<{
      id: number;
      name: string;
      designation: string;
      photo: string | null;
      status: "active" | "inactive";
      added_by?: string | null;
      added_date?: any;
      updated_by?: string | null;
      updated_date?: any;
      created_at?: any;
    }>(`
      SELECT id, name, designation, photo, status,
             added_by, added_date, updated_by, updated_date, created_at
      FROM management_team
      ORDER BY id DESC
    `);
    return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error("[management-team:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    const designation = String(form.get("designation") || "").trim();
    const image = form.get("image") as File | null;

    if (!name || !designation) {
      return NextResponse.json(
        { error: "Both name and designation are required" },
        { status: 400 }
      );
    }

    const addedBy = await actorFromSession();

    let storedPath: string | null = null;
    if (image && image.size > 0) {
      const arr = await image.arrayBuffer();
      const input = Buffer.from(arr as ArrayBuffer);

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "management");
      await ensureDir(uploadsDir);

      const base = sanitizeName(image.name || "photo.jpg");
      const outName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}`.replace(
        /\.(png|webp|gif|bmp|tiff)$/i,
        ".jpg"
      );
      const absOut = path.join(uploadsDir, outName);
      await sharp(input).rotate().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(absOut);
      storedPath = `management/${outName}`;
    }

    await query(
      `
      INSERT INTO management_team
        (name, designation, photo, status, added_by, added_date, updated_by, updated_date)
      VALUES
        (?, ?, ?, 'active', ?, NOW(), ?, NOW())
      `,
      [name, designation, storedPath, addedBy, addedBy]
    );

    return NextResponse.json({
      ok: true,
      photo: storedPath ? `/uploads/${storedPath}` : null,
    });
  } catch (err: any) {
    console.error("[management-team:POST] error:", err);
    return NextResponse.json({ error: err?.message || "Failed to save" }, { status: 500 });
  }
}
