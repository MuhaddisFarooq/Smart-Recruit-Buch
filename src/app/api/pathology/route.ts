// src/app/api/pathology/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/pathology?page=1&pageSize=10&search=
 * Returns: { data, total, page, pageSize }
 */
export async function GET(req: NextRequest) {
  try {
    // 🔒 Require "view"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "pathology", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)));
    const search = (searchParams.get("search") || "").trim();

    const where: string[] = [];
    const params: any[] = [];
    if (search) {
      where.push("(p.test_name LIKE ? OR p.department LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRows = await query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM pathology p ${whereSql}`,
      params
    );
    const total = totalRows[0]?.cnt ?? 0;

    const rows = await query<{
      id: number;
      test_name: string;
      price: number | null;
      department: string | null;
      status: "active" | "inactive";
      addedBy: string | null;
      addedDate: Date | null;
    }>(
      `
      SELECT
        p.id,
        p.test_name,
        p.price,
        p.department,
        p.status,
        p.addedBy,
        p.addedDate
      FROM pathology p
      ${whereSql}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (err: any) {
    console.error("[pathology:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

/**
 * POST /api/pathology
 * Body (JSON):
 * {
 *   test_name, price, department
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 🔒 Require "new"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "pathology", "new")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const testName = String(b?.test_name ?? "").trim();
    if (!testName) {
      return NextResponse.json({ error: "test_name is required" }, { status: 400 });
    }

    const addedBy = session.user?.email || session.user?.name || "system";

    const sql = `
      INSERT INTO pathology
      (
        test_name, price, department,
        status, addedBy, addedDate
      )
      VALUES
      (
        ?, ?, ?,
        'active', ?, NOW()
      )
    `;

    await query(sql, [
      testName,
      b.price ?? null,
      String(b.department ?? "").trim() || null,
      addedBy,
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[pathology:POST] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
