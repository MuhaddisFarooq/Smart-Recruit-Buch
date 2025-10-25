// src/app/api/fertility-treatments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import path from "path";
import { promises as fs } from "fs";
import { saveOptimizedImage } from "../../_helpers/image-processing";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const rows = await query<any>("SELECT * FROM fertility_treatments WHERE id=? LIMIT 1", [num]);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (e: any) {
    console.error("[fertility:GET one]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const actor = await actorFromSession();
    const now = new Date();

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let title: string | undefined;
    let details: string | undefined;
    let description_html: string | undefined;
    let imageRel: string | undefined;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      if (fd.has("title")) title = String(fd.get("title") || "");
      if (fd.has("details")) details = String(fd.get("details") || "");
      if (fd.has("description_html")) description_html = String(fd.get("description_html") || "");
      const file = fd.get("image") as File | null;
      if (file && file.size > 0) {
        imageRel = await saveOptimizedImage(file, "fertility", null, 98);
        // delete old
        const old = await query<{ image: string | null }>("SELECT image FROM fertility_treatments WHERE id=? LIMIT 1", [num]);
        const oldRel = old[0]?.image;
        if (oldRel) fs.unlink(path.join(process.cwd(), "public", "uploads", oldRel)).catch(() => void 0);
      }
    } else {
      const b: any = await req.json().catch(() => ({}));
      if (b.title !== undefined) title = String(b.title || "");
      if (b.details !== undefined) details = String(b.details || "");
      if (b.description_html !== undefined) description_html = String(b.description_html || "");
    }

    const sets: string[] = [];
    const args: any[] = [];

    if (title !== undefined) { sets.push("title=?"); args.push(title); }
    if (details !== undefined) { sets.push("details=?"); args.push(details || null); }
    if (description_html !== undefined) { sets.push("description_html=?"); args.push(description_html || null); }
    if (imageRel !== undefined) { sets.push("image=?"); args.push(imageRel); }

    if (!sets.length) return NextResponse.json({ ok: true, message: "nothing to update" });

    sets.push("updatedBy=?"); args.push(actor);
    sets.push("updatedDate=?"); args.push(now);

    await query(`UPDATE fertility_treatments SET ${sets.join(", ")} WHERE id=?`, [...args, num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[fertility:PATCH]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const old = await query<{ image: string | null }>(
      "SELECT image FROM fertility_treatments WHERE id=? LIMIT 1", [num]
    );
    const oldRel = old[0]?.image;
    if (oldRel) fs.unlink(path.join(process.cwd(), "public", "uploads", oldRel)).catch(() => void 0);

    await query("DELETE FROM fertility_treatments WHERE id=?", [num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[fertility:DELETE]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
