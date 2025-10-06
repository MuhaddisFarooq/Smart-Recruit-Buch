// src/app/api/consultants/main-categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ✅ mysql2 -> Node

export async function GET(_req: NextRequest) {
  try {
    // 🔒 Require "view"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "consultants", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await query(
      "SELECT id, cat_name FROM consultant_main_category ORDER BY id ASC"
    );
    return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error("[main-categories] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
