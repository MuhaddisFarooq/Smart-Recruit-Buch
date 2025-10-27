import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/blogs/categories
 * Returns distinct categories from blogs table
 */
export async function GET(req: NextRequest) {
  try {
    const results = await query<{ category: string }>(
      `SELECT DISTINCT category 
       FROM blogs 
       WHERE category IS NOT NULL AND category != '' 
       ORDER BY category ASC`
    );

    const categories = results.map((r) => r.category);

    return NextResponse.json({ categories }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/blogs/categories error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
