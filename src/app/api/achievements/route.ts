// src/app/api/achievements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { saveOptimizedImage } from "../_helpers/image-processing";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";

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

/** GET all (latest first)
 *  ✅ Public GET (for website)
 *  🔒 If session exists, enforce perms
 */
export async function GET() {
  try {
    await ensureTable();

    const session = await getServerSession(authOptions).catch(() => null);

    // If logged-in (admin portal), enforce permission
    if (session) {
      const perms = (session.user as any)?.perms;
      if (!hasPerm(perms, "achievements", "view")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    // If NOT logged-in: allow public read for website

    const rows = await query<{ id: number; image: string; addedBy: string; addedDate: any }>(`
      SELECT id, image, addedBy, addedDate
      FROM achievements
      ORDER BY id DESC
    `);

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

    // 🔒 Require "new"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "achievements", "new")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Use high-quality image processing that preserves PNG transparency
    const rel = await saveOptimizedImage(file, "achievements", null, 98);
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
