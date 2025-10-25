import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import path from "path";
import { promises as fs } from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
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

    const rows = await query<any>("SELECT * FROM clinical_study WHERE id=? LIMIT 1", [num]);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (e: any) {
    console.error("[clinical:GET one]", e);
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

    // Toggle status fast-path
    const maybeJson = await req.clone().json().catch(() => null);
    if (maybeJson && (maybeJson as any).toggleStatus) {
      const cur = await query<{ status: string }>("SELECT status FROM clinical_study WHERE id=? LIMIT 1", [num]);
      if (!cur.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const next = cur[0].status === "active" ? "inactive" : "active";
      await query("UPDATE clinical_study SET status=?, updatedBy=?, updatedDate=? WHERE id=?", [next, actor, now, num]);
      return NextResponse.json({ ok: true, status: next });
    }

    // Full update (optional multipart)
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let heading_name: string | undefined;
    let description: string | undefined;
    let link: string | undefined;
    let details: string | undefined;
    let pictureRel: string | undefined;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      if (fd.has("heading_name")) heading_name = String(fd.get("heading_name") || "");
      if (fd.has("description"))  description  = String(fd.get("description")  || "");
      if (fd.has("link"))         link         = String(fd.get("link")         || "");
      if (fd.has("details"))      details      = String(fd.get("details")      || "");
      const file = fd.get("image") as File | null;
      if (file && file.size > 0) {
        pictureRel = await saveOptimizedImage(file, "clinical", null, 98);
        // delete old file
        const old = await query<{ picture: string | null }>("SELECT picture FROM clinical_study WHERE id=? LIMIT 1", [num]);
        const oldRel = old[0]?.picture;
        if (oldRel) fs.unlink(path.join(process.cwd(), "public", "uploads", oldRel)).catch(() => void 0);
      }
    } else {
      const body = (maybeJson ?? await req.json().catch(() => ({}))) as any;
      if (body.heading_name !== undefined) heading_name = String(body.heading_name || "");
      if (body.description  !== undefined) description  = String(body.description  || "");
      if (body.link         !== undefined) link         = String(body.link         || "");
      if (body.details      !== undefined) details      = String(body.details      || "");
      // no binary picture via JSON
    }

    const sets: string[] = [];
    const args: any[] = [];
    if (heading_name !== undefined) { sets.push("heading_name=?"); args.push(heading_name); }
    if (description  !== undefined) { sets.push("description=?");  args.push(description); }
    if (link         !== undefined) { sets.push("link=?");         args.push(link); }
    if (details      !== undefined) { sets.push("details=?");      args.push(details); }
    if (pictureRel   !== undefined) { sets.push("picture=?");      args.push(pictureRel); }

    if (!sets.length) return NextResponse.json({ ok: true, message: "nothing to update" });

    sets.push("updatedBy=?");   args.push(actor);
    sets.push("updatedDate=?"); args.push(now);

    await query(`UPDATE clinical_study SET ${sets.join(", ")} WHERE id=?`, [...args, num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[clinical:PATCH]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const old = await query<{ picture: string | null }>("SELECT picture FROM clinical_study WHERE id=? LIMIT 1", [num]);
    const oldRel = old[0]?.picture;
    if (oldRel) fs.unlink(path.join(process.cwd(), "public", "uploads", oldRel)).catch(() => void 0);

    await query("DELETE FROM clinical_study WHERE id=?", [num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[clinical:DELETE]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
