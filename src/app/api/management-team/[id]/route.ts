// src/app/api/management-team/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}
async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}
async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}

/** GET one */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 Require "view"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "management_team", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await ctx.params;        // ← await params
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const rows = await query<{
      id: number;
      name: string;
      designation: string;
      photo: string | null;
      status: "active" | "inactive";
      added_by?: string | null;
      added_date?: any;
      updated_by?: string | null;
      updated_date?: any;
    }>(
      `SELECT id, name, designation, photo, status,
              added_by, added_date, updated_by, updated_date
       FROM management_team WHERE id=? LIMIT 1`,
      [id]
    );

    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err: any) {
    console.error("[management-team:GET one] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

/** PATCH/PUT */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 Require "edit"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "management_team", "edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await ctx.params;        // ← await params
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const updatedBy = await actorFromSession();
    const ct = (req.headers.get("content-type") || "").toLowerCase();

    // JSON quick toggle
    if (ct.includes("application/json")) {
      const b = await req.json().catch(() => ({}));
      if (b?.toggleStatus) {
        await query(
          `UPDATE management_team
             SET status = CASE WHEN status='active' THEN 'inactive' ELSE 'active' END,
                 updated_by = ?, updated_date = NOW()
           WHERE id = ?`,
          [updatedBy, id]
        );
        return NextResponse.json({ ok: true });
      }
    }

    let name: string | undefined;
    let designation: string | undefined;
    let newPhotoRel: string | undefined;

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      if (form.has("name")) name = String(form.get("name") || "").trim();
      if (form.has("designation")) designation = String(form.get("designation") || "").trim();

      const image = form.get("image") as File | null;
      if (image && image.size > 0) {
        const arr = await image.arrayBuffer();
        const input = Buffer.from(arr as ArrayBuffer);

        const uploadsDir = path.join(process.cwd(), "public", "uploads", "management");
        await ensureDir(uploadsDir);

        const base = sanitizeName(image.name || "photo.jpg");
        const outName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}`.replace(
          /\.(png|webp|gif|bmp|tiff)$/i,
          ".jpg"
        );
        const absOut = path.join(uploadsDir, outName);
        await sharp(input).rotate().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(absOut);
        newPhotoRel = `management/${outName}`;

        // delete old photo (best-effort)
        const old = await query<{ photo: string | null }>(
          "SELECT photo FROM management_team WHERE id=? LIMIT 1",
          [id]
        );
        const oldRel = old[0]?.photo;
        if (oldRel) {
          const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
          fs.unlink(absOld).catch(() => void 0);
        }
      }
    } else if (ct.includes("application/json")) {
      const b = await req.json().catch(() => ({}));
      if (b.name !== undefined) name = String(b.name || "").trim();
      if (b.designation !== undefined) designation = String(b.designation || "").trim();
    }

    const sets: string[] = [];
    const args: any[] = [];

    if (name !== undefined) {
      if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
      sets.push("name=?"); args.push(name);
    }
    if (designation !== undefined) {
      if (!designation) return NextResponse.json({ error: "designation is required" }, { status: 400 });
      sets.push("designation=?"); args.push(designation);
    }
    if (newPhotoRel !== undefined) { sets.push("photo=?"); args.push(newPhotoRel); }

    sets.push("updated_by=?"); args.push(updatedBy);
    sets.push("updated_date=NOW()");

    if (!sets.length) return NextResponse.json({ ok: true, message: "nothing to update" });

    await query(`UPDATE management_team SET ${sets.join(", ")} WHERE id=?`, [...args, id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[management-team:PATCH] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
export const PUT = PATCH;

/** DELETE */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 Require "delete"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "management_team", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await ctx.params;        // ← await params
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const old = await query<{ photo: string | null }>(
      "SELECT photo FROM management_team WHERE id=? LIMIT 1",
      [id]
    );
    const oldRel = old[0]?.photo;
    if (oldRel) {
      const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
      fs.unlink(absOld).catch(() => void 0);
    }

    await query("DELETE FROM management_team WHERE id=?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[management-team:DELETE] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
