// src/app/api/popups/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import path from "path";
import { promises as fs } from "fs";
import { saveOptimizedImage } from "../../_helpers/image-processing";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    // 🔒 Require "view"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "popup", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const rows = await query<any>("SELECT * FROM popups WHERE id=? LIMIT 1", [num]);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (e: any) {
    console.error("[popup:GET one]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    // 🔒 Require "edit"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "popup", "edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const actor = await actorFromSession();
    const now = new Date();

    // Fast-path: toggle status
    const maybeJson = await req.clone().json().catch(() => null);
    if (maybeJson && (maybeJson as any).toggleStatus) {
      const cur = await query<{ status: string }>("SELECT status FROM popups WHERE id=? LIMIT 1", [num]);
      if (!cur.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const next = cur[0].status === "active" ? "inactive" : "active";
      await query(
        "UPDATE popups SET status=?, updatedBy=?, updatedDate=? WHERE id=?",
        [next, actor, now, num]
      );
      return NextResponse.json({ ok: true, status: next });
    }

    // Otherwise: update fields (multipart or json)
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let start_date: string | undefined;
    let end_date: string | undefined;
    let status: string | undefined;
    let imageRel: string | undefined;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      if (fd.has("start_date")) start_date = String(fd.get("start_date") || "");
      if (fd.has("end_date")) end_date = String(fd.get("end_date") || "");
      if (fd.has("status")) status = String(fd.get("status") || "");

      const file = fd.get("image") as File | null;
      if (file && file.size > 0) {
        imageRel = await saveOptimizedImage(file, "popup", null, 98);
        // delete old
        const old = await query<{ image: string | null }>("SELECT image FROM popups WHERE id=? LIMIT 1", [num]);
        const oldRel = old[0]?.image;
        if (oldRel) {
          const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
          fs.unlink(absOld).catch(() => void 0);
        }
      }
    } else {
      const b: any = maybeJson ?? (await req.json().catch(() => ({})));
      if (b.start_date !== undefined) start_date = String(b.start_date || "");
      if (b.end_date !== undefined) end_date = String(b.end_date || "");
      if (b.status !== undefined) status = String(b.status || "");
      // no binary image via JSON
    }

    const sets: string[] = [];
    const args: any[] = [];

    if (start_date !== undefined) {
      const d = new Date(start_date);
      if (!Number.isFinite(d.valueOf())) return NextResponse.json({ error: "Bad start_date" }, { status: 400 });
      sets.push("start_date=?"); args.push(d);
    }
    if (end_date !== undefined) {
      const d = new Date(end_date);
      if (!Number.isFinite(d.valueOf())) return NextResponse.json({ error: "Bad end_date" }, { status: 400 });
      sets.push("end_date=?"); args.push(d);
    }
    if (status !== undefined) {
      const s = status === "inactive" ? "inactive" : "active";
      sets.push("status=?"); args.push(s);
    }
    if (imageRel !== undefined) { sets.push("image=?"); args.push(imageRel); }

    if (!sets.length) return NextResponse.json({ ok: true, message: "nothing to update" });

    sets.push("updatedBy=?"); args.push(actor);
    sets.push("updatedDate=?"); args.push(now);

    await query(`UPDATE popups SET ${sets.join(", ")} WHERE id=?`, [...args, num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[popup:PATCH]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    // 🔒 Require "delete"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "popup", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const old = await query<{ image: string | null }>("SELECT image FROM popups WHERE id=? LIMIT 1", [num]);
    const oldRel = old[0]?.image;
    if (oldRel) {
      const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
      fs.unlink(absOld).catch(() => void 0);
    }

    await query("DELETE FROM popups WHERE id=?", [num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[popup:DELETE]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
