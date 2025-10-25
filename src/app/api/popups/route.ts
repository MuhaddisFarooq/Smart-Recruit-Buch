// src/app/api/popups/route.ts
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

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS popups (
      id INT(11) NOT NULL AUTO_INCREMENT,
      image VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      start_date DATETIME NOT NULL,
      end_date   DATETIME NOT NULL,
      status VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
      addedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      addedDate DATETIME NOT NULL,
      updatedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NULL,
      updatedDate DATETIME NULL,
      PRIMARY KEY (id),
      KEY idx_dates (start_date, end_date),
      KEY idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/** List */
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
      // simple search on status
      where.push("(status LIKE ?)");
      args.push(`%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRows = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM popups ${whereSql}`, args
    );
    const total = totalRows[0]?.cnt ?? 0;

    const rows = await query<any>(
      `SELECT id, image, start_date, end_date, status
       FROM popups
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (e: any) {
    console.error("[popup:GET]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** Create */
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const actor = await actorFromSession();

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Use multipart/form-data" }, { status: 400 });
    }

    const fd = await req.formData();
    const startRaw = String(fd.get("start_date") || "");
    const endRaw = String(fd.get("end_date") || "");
    let status = (String(fd.get("status") || "active") || "active").trim();

    const img = fd.get("image") as File | null;
    if (!img || img.size <= 0) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 });
    }
    if (!startRaw || !endRaw) {
      return NextResponse.json({ error: "Start and end date are required." }, { status: 400 });
    }

    const startDate = new Date(startRaw);
    const endDate = new Date(endRaw);
    if (!Number.isFinite(startDate.valueOf()) || !Number.isFinite(endDate.valueOf()) || endDate < startDate) {
      return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
    }
    if (status !== "active" && status !== "inactive") status = "active";

    const rel = await saveOptimizedImage(img, "popup", null, 98);

    await query(
      `INSERT INTO popups (image, start_date, end_date, status, addedBy, addedDate, updatedBy, updatedDate)
       VALUES (?, ?, ?, ?, ?, NOW(), NULL, NULL)`,
      [rel, startDate, endDate, status, actor]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[popup:POST]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
