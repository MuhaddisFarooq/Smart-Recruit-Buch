import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/* ------------------------------ GET (unchanged except: include cat_img in legacy mode) ------------------------------ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const mainIdRaw = searchParams.get("main_id");
    const mainName  = searchParams.get("main");

    const hasPagingSignals =
      searchParams.has("page") || searchParams.has("pageSize") || searchParams.has("search");

    let mainId: number | null = null;
    if (mainIdRaw) {
      const n = Number(mainIdRaw);
      if (Number.isFinite(n)) mainId = n;
    } else if (mainName) {
      const rows = await query<{ id: number }>(
        "SELECT id FROM consultant_main_category WHERE cat_name = ? LIMIT 1",
        [mainName]
      );
      mainId = rows[0]?.id ?? null;
    }

    // Legacy mode: return all subs for a given main (now includes cat_img)
    if (mainId !== null && !hasPagingSignals) {
      const rows = await query<{ id: number; cat_name: string; main_cat_id: number; cat_img: string | null }>(
        `
        SELECT id, cat_name, main_cat_id, cat_img
        FROM consultant_category
        WHERE main_cat_id = ?
        ORDER BY id ASC
        `,
        [mainId]
      );
      return NextResponse.json({ data: rows });
    }

    // Listing mode (kept as-is)
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 10)));
    const search = (searchParams.get("search") || "").trim();

    const where: string[] = [];
    const params: any[] = [];

    if (mainId !== null) {
      where.push("c.main_cat_id = ?");
      params.push(mainId);
    }
    if (search) {
      where.push("(c.cat_name LIKE ? OR m.cat_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRows = await query<{ cnt: number }>(
      `
      SELECT COUNT(*) as cnt
      FROM consultant_category c
      LEFT JOIN consultant_main_category m ON m.id = c.main_cat_id
      ${whereSql}
      `,
      params
    );
    const total = totalRows[0]?.cnt ?? 0;

    const rows = await query<{
      id: number;
      cat_name: string;
      main_cat_id: number | null;
      main_cat_name: string | null;
    }>(
      `
      SELECT
        c.id,
        c.cat_name,
        c.main_cat_id,
        m.cat_name AS main_cat_name
      FROM consultant_category c
      LEFT JOIN consultant_main_category m ON m.id = c.main_cat_id
      ${whereSql}
      ORDER BY c.id ASC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ data: rows, total, page, pageSize });
  } catch (err: any) {
    console.error("[categories:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

/* ------------------------------ POST (create; now supports cat_img) ------------------------------ */
export async function POST(req: NextRequest) {
  try {
    // try JSON; if not, gracefully empty
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const cat_name    = String(body?.cat_name || "").trim();
    const main_cat_id = Number(body?.main_cat_id);
    const rawImg      = body?.cat_img;
    const cat_img =
      rawImg == null || rawImg === "" ? null : String(rawImg).trim();

    if (!cat_name || !Number.isInteger(main_cat_id)) {
      return NextResponse.json(
        { error: "main_cat_id (number) and cat_name are required" },
        { status: 400 }
      );
    }

    // Insert, storing cat_img if provided (nullable)
    await query(
      "INSERT INTO consultant_category (cat_name, main_cat_id, cat_img) VALUES (?, ?, ?)",
      [cat_name, main_cat_id, cat_img]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[categories:POST] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
