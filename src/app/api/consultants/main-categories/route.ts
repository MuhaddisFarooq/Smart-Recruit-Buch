import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query(
      "SELECT id, cat_name FROM consultant_main_category ORDER BY id ASC"
    );
    return NextResponse.json({ data: rows });
  } catch (err: any) {
    // shows up in the server terminal
    console.error("[main-categories] DB error:", err);
    return NextResponse.json(
      { error: err?.message || "DB error" },
      { status: 500 }
    );
  }
}
