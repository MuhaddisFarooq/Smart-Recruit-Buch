// src/app/api/consultants/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ✅ mysql2 -> Node

async function readBody(req: NextRequest) {
  const ct = (req.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    try { return await req.json(); } catch {}
  }
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    return Object.fromEntries(fd.entries());
  }
  try { return await req.json(); } catch { return {}; }
}

/** GET one sub-category (with description) */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 🔒 Require "view"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "consultants", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const rows = await query<{
      id: number;
      cat_name: string;
      main_cat_id: number | null;
      main_cat_name: string | null;
      cat_description: string | null;
      cat_img: string | null;
    }>(
      `
      SELECT c.id, c.cat_name, c.main_cat_id, c.cat_description, c.cat_img, m.cat_name AS main_cat_name
      FROM consultant_category c
      LEFT JOIN consultant_main_category m ON m.id = c.main_cat_id
      WHERE c.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err: any) {
    console.error("[categories/[id]:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

/** PATCH/PUT: update sub-category (name/main/description) */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 🔒 Require "edit"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "consultants", "edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const b: any = await readBody(req);

    const catNameRaw   = b.cat_name ?? b.name;
    const mainRaw      = b.main_cat_id ?? b.mainCatId ?? b.main_id ?? b.mainCategoryId;
    const descRaw      = b.cat_description ?? b.description;
    const catImgRaw    = b.cat_img;

    const sets: string[] = [];
    const args: any[] = [];

    if (catNameRaw !== undefined) {
      const catName = String(catNameRaw).trim();
      if (!catName) return NextResponse.json({ error: "cat_name is required" }, { status: 400 });
      sets.push("cat_name = ?");
      args.push(catName);
    }

    if (mainRaw !== undefined) {
      const mainId = mainRaw === "" || mainRaw == null ? null : Number(mainRaw);
      if (mainId !== null && !Number.isFinite(mainId)) {
        return NextResponse.json({ error: "main_cat_id must be a number or null" }, { status: 400 });
      }
      sets.push("main_cat_id = ?");
      args.push(mainId);
    }

    if (descRaw !== undefined) {
      const desc = descRaw == null ? null : String(descRaw).trim();
      sets.push("cat_description = ?");
      args.push(desc);
    }

    if (catImgRaw !== undefined) {
      const catImg = catImgRaw == null || catImgRaw === "" ? null : String(catImgRaw).trim();
      sets.push("cat_img = ?");
      args.push(catImg);
    }

    if (!sets.length) return NextResponse.json({ ok: true, message: "nothing to update" });

    await query(`UPDATE consultant_category SET ${sets.join(", ")} WHERE id = ?`, [...args, id]);

    const after = await query<{ id: number; cat_name: string; main_cat_id: number | null; cat_description: string | null; cat_img: string | null }>(
      "SELECT id, cat_name, main_cat_id, cat_description, cat_img FROM consultant_category WHERE id = ? LIMIT 1",
      [id]
    );

    return NextResponse.json({ ok: true, data: after[0] ?? null });
  } catch (err: any) {
    console.error("[categories/[id]:PATCH] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
export const PUT = PATCH;

/** DELETE */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 🔒 Require "delete"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "consultants", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    await query("DELETE FROM consultant_category WHERE id = ? LIMIT 1", [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[categories/[id]:DELETE] DB error:", err);
    const code = err?.code || err?.errno;
    const isFk = code === "ER_ROW_IS_REFERENCED_2" || code === 1451;
    return NextResponse.json(
      { error: isFk ? "Cannot delete: category is in use." : (err?.message || "DB error") },
      { status: isFk ? 409 : 500 }
    );
  }
}
