import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("search") || "").trim().replace(/^#/, "");
    if (!q) return NextResponse.json({ data: [] });

    const rows = await query<{ tag: string; usage_count: number }>(
      `SELECT tag, usage_count
         FROM hashtags
        WHERE tag LIKE ?
        ORDER BY usage_count DESC, tag ASC
        LIMIT 20`,
      [`%${q}%`]
    );

    return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error("[hashtags:GET]", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
