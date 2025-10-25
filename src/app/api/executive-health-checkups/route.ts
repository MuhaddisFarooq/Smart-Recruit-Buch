import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import path from "path";
import { promises as fs } from "fs";
import { saveOptimizedImage } from "../_helpers/image-processing";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const session = await getServerSession(authOptions).catch(() => null);
  return session?.user?.email || session?.user?.name || "system";
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS executive_health_checkups (
      id INT(11) NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      price_label VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      image VARCHAR(255) COLLATE utf8mb4_unicode_ci NULL,
      consultations TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      cardiology_tests TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      radiology_tests TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      lab_tests TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      instructions TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      status VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
      addedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      addedDate DATETIME NOT NULL,
      updatedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NULL,
      updatedDate DATETIME NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/** GET /api/executive-health-checkups?page=1&pageSize=10&search=... */
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
      where.push(`(title LIKE ? OR price_label LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRows = await query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM executive_health_checkups ${whereSql}`,
      params
    );
    const total = totalRows[0]?.cnt ?? 0;

    const rows = await query<any>(
      `
      SELECT id, title, price_label, image, status
      FROM executive_health_checkups
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (err: any) {
    console.error("[ehc:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

/** POST /api/executive-health-checkups — create (multipart supported) */
export async function POST(req: NextRequest) {
  try {
    await ensureTable();

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    const actor = await actorFromSession();

    let title = "";
    let price_label = "";
    let consultations = "";
    let cardiology_tests = "";
    let radiology_tests = "";
    let lab_tests = "";
    let instructions = "";
    let status = "active";
    let image: string | null = null;

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      title = String(form.get("title") || "").trim();
      price_label = String(form.get("price_label") || "").trim();
      consultations = String(form.get("consultations") || "").trim();
      cardiology_tests = String(form.get("cardiology_tests") || "").trim();
      radiology_tests = String(form.get("radiology_tests") || "").trim();
      lab_tests = String(form.get("lab_tests") || "").trim();
      instructions = String(form.get("instructions") || "").trim();
      status = String(form.get("status") || "active").trim() || "active";

      const imageFile = form.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        image = await saveOptimizedImage(imageFile, "executive", null, 98);
      }
    } else {
      const b = (await req.json().catch(() => ({}))) as any;
      title = String(b?.title || "").trim();
      price_label = String(b?.price_label || "").trim();
      consultations = String(b?.consultations || "").trim();
      cardiology_tests = String(b?.cardiology_tests || "").trim();
      radiology_tests = String(b?.radiology_tests || "").trim();
      lab_tests = String(b?.lab_tests || "").trim();
      instructions = String(b?.instructions || "").trim();
      status = (b?.status && String(b.status).trim()) || "active";
      image = b?.image ? String(b.image) : null;
    }

    if (!title || !price_label || !consultations || !instructions) {
      return NextResponse.json(
        { error: "Please provide title, price, consultations and instructions." },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO executive_health_checkups
        (title, price_label, image, consultations, cardiology_tests, radiology_tests, lab_tests, instructions, status, addedBy, addedDate, updatedBy, updatedDate)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)
      `,
      [
        title,
        price_label,
        image,
        consultations,
        cardiology_tests,
        radiology_tests,
        lab_tests,
        instructions,
        status,
        actor,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[ehc:POST] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
