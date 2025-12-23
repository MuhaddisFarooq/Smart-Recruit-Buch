import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INT(11) NOT NULL AUTO_INCREMENT,
      patient_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
      details TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      video_link TEXT COLLATE utf8mb4_unicode_ci NULL,
      status VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
      addedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      addedDate DATETIME NOT NULL,
      updatedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NULL,
      updatedDate DATETIME NULL,
      PRIMARY KEY (id),
      KEY idx_status (status),
      FULLTEXT KEY idx_text (patient_name, details)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/** GET /api/testimonials?page=&pageSize=&search= */
export async function GET(req: NextRequest) {
  try {
    await ensureTable();

    const sp = new URL(req.url).searchParams;
    const page = Math.max(1, Number(sp.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") || 10)));
    const search = (sp.get("search") || "").trim();

    // ✅ PUBLIC ACCESS FOR WEBSITE (no session)
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session) {
      const where: string[] = ["status = 'active'"];
      const args: any[] = [];

      if (search) {
        where.push("(patient_name LIKE ? OR details LIKE ?)");
        args.push(`%${search}%`, `%${search}%`);
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const totalRows = await query<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM testimonials ${whereSql}`,
        args
      );
      const total = totalRows[0]?.cnt ?? 0;

      const rows = await query<any>(
        `SELECT id, patient_name, details, video_link, status
         FROM testimonials
         ${whereSql}
         ORDER BY id DESC
         LIMIT ? OFFSET ?`,
        [...args, pageSize, (page - 1) * pageSize]
      );

      return NextResponse.json({ data: rows, total, page, pageSize });
    }

    // 🔒 ADMIN ACCESS (unchanged)
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "testimonials", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const where: string[] = [];
    const args: any[] = [];
    if (search) {
      where.push("(patient_name LIKE ? OR details LIKE ?)");
      args.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRows = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM testimonials ${whereSql}`,
      args
    );
    const total = totalRows[0]?.cnt ?? 0;

    const rows = await query<any>(
      `SELECT id, patient_name, details, video_link, status
       FROM testimonials
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (e: any) {
    console.error("[testimonials:GET]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** POST /api/testimonials */
export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const actor = await actorFromSession();

    // 🔒 Require "new"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "testimonials", "new")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const b = (await req.json().catch(() => ({}))) as any;

    const patient_name = String(b.patient_name || "").trim();
    const details = String(b.details || "").trim();
    const video_link = String(b.video_link || "").trim();
    let status = String(b.status || "active").toLowerCase() === "inactive" ? "inactive" : "active";

    if (!patient_name || !details) {
      return NextResponse.json({ error: "patient_name and details are required." }, { status: 400 });
    }

    await query(
      `INSERT INTO testimonials
       (patient_name, details, video_link, status, addedBy, addedDate, updatedBy, updatedDate)
       VALUES (?, ?, ?, ?, ?, NOW(), NULL, NULL)`,
      [patient_name, details, video_link || null, status, actor]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[testimonials:POST]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
