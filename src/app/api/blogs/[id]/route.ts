// src/app/api/blogs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // mysql2 requires Node runtime

async function ensureDir(d: string) { await fs.mkdir(d, { recursive: true }); }
function rand() { return crypto.randomBytes(8).toString("hex"); }
function sanitize(n: string) { return n.replace(/[^a-zA-Z0-9._-]+/g, "_"); }

async function actor() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}

async function saveUploadedFile(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const folder = path.join(process.cwd(), "public", "uploads", "blogs");
  await ensureDir(folder);
  const out = `${Date.now()}_${rand()}_${sanitize(file.name || "file")}`;
  await fs.writeFile(path.join(folder, out), buf);
  return `blogs/${out}`; // relative under /public/uploads
}

/** GET /api/blogs/[id] */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params; // <-- await params
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const rows = await query<any>("SELECT * FROM blogs WHERE id=? LIMIT 1", [num]);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (e: any) {
    console.error("[blogs:[id]:GET]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** PATCH /api/blogs/[id]  (JSON or multipart) */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params; // <-- await params
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const who = await actor();
    const now = new Date();

    const ct = (req.headers.get("content-type") || "").toLowerCase();

    let title: string | undefined;
    let category: string | undefined;
    let description_html: string | undefined;
    let featured_post: number | undefined;
    let newFileRel: string | undefined;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      if (fd.has("title")) title = String(fd.get("title") || "");
      if (fd.has("category")) category = String(fd.get("category") || "");
      if (fd.has("description_html")) description_html = String(fd.get("description_html") || "");
      if (fd.has("featured_post")) featured_post = String(fd.get("featured_post") || "") === "1" ? 1 : 0;

      const file = fd.get("file") as File | null;
      if (file && file.size > 0) {
        newFileRel = await saveUploadedFile(file);
        // delete old file if present
        const old = await query<{ file_path: string | null }>("SELECT file_path FROM blogs WHERE id=? LIMIT 1", [num]);
        const oldRel = old[0]?.file_path;
        if (oldRel) fs.unlink(path.join(process.cwd(), "public", "uploads", oldRel)).catch(() => void 0);
      }
    } else {
      const b: any = await req.json().catch(() => ({}));
      if ("title" in b) title = String(b.title || "");
      if ("category" in b) category = String(b.category || "");
      if ("description_html" in b) description_html = String(b.description_html || "");
      if ("featured_post" in b) featured_post = Number(b.featured_post) ? 1 : 0;
    }

    const sets: string[] = ["updatedBy=?", "updatedDate=?"];
    const args: any[] = [who, now];

    if (title !== undefined) { sets.push("title=?"); args.push(title); }
    if (category !== undefined) { sets.push("category=?"); args.push(category || null); }
    if (description_html !== undefined) { sets.push("description_html=?"); args.push(description_html); }
    if (featured_post !== undefined) { sets.push("featured_post=?"); args.push(featured_post); }
    if (newFileRel !== undefined) { sets.push("file_path=?"); args.push(newFileRel); }

    if (sets.length === 2) return NextResponse.json({ ok: true, message: "nothing to update" });

    await execute(`UPDATE blogs SET ${sets.join(", ")} WHERE id=?`, [...args, num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[blogs:[id]:PATCH]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** DELETE /api/blogs/[id] */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params; // <-- await params
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const old = await query<{ file_path: string | null }>("SELECT file_path FROM blogs WHERE id=? LIMIT 1", [num]);
    const rel = old[0]?.file_path;
    if (rel) fs.unlink(path.join(process.cwd(), "public", "uploads", rel)).catch(() => void 0);

    await execute("DELETE FROM blogs WHERE id=?", [num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[blogs:[id]:DELETE]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
