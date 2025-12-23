// src/app/api/careers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const session = await getServerSession(authOptions).catch(() => null);
  return session?.user?.email || session?.user?.name || "system";
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS careers (
      id INT(11) NOT NULL AUTO_INCREMENT,
      job_title TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      type_of_employment TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      department TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      location TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      job_link TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      status TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      addedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
      addedDate DATETIME NOT NULL,
      updatedBy VARCHAR(100) COLLATE utf8mb4_unicode_ci NULL,
      updatedDate DATETIME NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

/** GET /api/careers?page=1&pageSize=10&search=... */
export async function GET(req: NextRequest) {
  try {
    await ensureTable();

    // 🔒 Require "view"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "careers", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)));
    const search = (searchParams.get("search") || "").trim();

    const where: string[] = [];
    const params: any[] = [];
    if (search) {
      where.push(`(
        job_title LIKE ? OR type_of_employment LIKE ? OR
        department LIKE ? OR location LIKE ?
      )`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRows = await query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM careers ${whereSql}`,
      params
    );
    const total = totalRows[0]?.cnt ?? 0;

    const rows = await query<{
      id: number;
      job_title: string;
      type_of_employment: string;
      department: string | null;
      status: "active" | "inactive";
    }>(
      `
      SELECT id, job_title, type_of_employment, department, status
      FROM careers
      ${whereSql}
      ORDER BY id ASC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (err: any) {
    console.error("[careers:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

/** POST /api/careers  — create */
export async function POST(req: NextRequest) {
  try {
    await ensureTable();

    // 🔒 Require "new"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "careers", "new")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const b = (await req.json().catch(() => ({}))) as {
      job_title?: string;
      type_of_employment?: string;
      department?: string;
      location?: string;
      job_link?: string;
      status?: string;
    };

    const job_title = String(b.job_title ?? "").trim();
    const type_of_employment = String(b.type_of_employment ?? "").trim();
    const department = String(b.department ?? "").trim();
    const location = String(b.location ?? "").trim();
    const job_link = String(b.job_link ?? "").trim();
    const status = (b.status && String(b.status).trim()) || "active";

    if (!job_title || !type_of_employment || !department || !location) {
      return NextResponse.json(
        { error: "Please provide job_title, type_of_employment, department and location." },
        { status: 400 }
      );
    }

    const actorEmail = await actorFromSession();

    await query(
      `
      INSERT INTO careers
        (job_title, type_of_employment, department, location, job_link, status, addedBy, addedDate, updatedBy, updatedDate)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, NOW(), NULL, NULL)
      `,
      [job_title, type_of_employment, department, location, job_link, status, actorEmail]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[careers:POST] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
