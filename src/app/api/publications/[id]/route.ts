import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}
async function ensureDir(d: string) { await fs.mkdir(d, { recursive: true }); }
function sanitize(n: string) { return n.replace(/[^a-zA-Z0-9._-]+/g, "_"); }
async function saveCompressedJpeg(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const folder = path.join(process.cwd(), "public", "uploads", "publications");
  await ensureDir(folder);
  const base = sanitize(file.name || "publication.jpg").replace(/\.(png|webp|gif|bmp|tiff)$/i, ".jpg");
  const out = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}`;
  const abs = path.join(folder, out);
  await sharp(buf).rotate().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(abs);
  return `publications/${out}`;
}

/** GET one */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    const rows = await query<any>("SELECT * FROM publications WHERE id=? LIMIT 1", [num]);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (e: any) {
    console.error("[publications:GET one]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** UPDATE (json or multipart) + toggleStatus */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const actor = await actorFromSession();
    const now = new Date();

    const maybeJson = await req.clone().json().catch(() => null);
    if (maybeJson && (maybeJson as any).toggleStatus) {
      const cur = await query<{ status: string }>("SELECT status FROM publications WHERE id=? LIMIT 1", [num]);
      if (!cur.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const next = cur[0].status === "active" ? "inactive" : "active";
      await query("UPDATE publications SET status=?, updatedBy=?, updatedDate=? WHERE id=?",
        [next, actor, now, num]);
      return NextResponse.json({ ok: true, status: next });
    }

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let heading_name: string | undefined;
    let description : string | undefined;
    let link        : string | undefined;
    let details     : string | undefined;
    let pictureRel  : string | undefined;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      if (fd.has("heading_name")) heading_name = String(fd.get("heading_name") || "");
      if (fd.has("description"))  description  = String(fd.get("description")  || "");
      if (fd.has("link"))         link         = String(fd.get("link")         || "");
      if (fd.has("details"))      details      = String(fd.get("details")      || "");
      const file = fd.get("picture") as File | null;
      if (file && file.size > 0) {
        pictureRel = await saveCompressedJpeg(file);
        const old = await query<{ picture: string | null }>("SELECT picture FROM publications WHERE id=? LIMIT 1", [num]);
        const oldRel = old[0]?.picture;
        if (oldRel) {
          const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
          fs.unlink(absOld).catch(() => void 0);
        }
      }
    } else {
      const b: any = maybeJson ?? (await req.json().catch(() => ({})));
      if (b.heading_name !== undefined) heading_name = String(b.heading_name || "");
      if (b.description  !== undefined) description  = String(b.description  || "");
      if (b.link         !== undefined) link         = String(b.link         || "");
      if (b.details      !== undefined) details      = String(b.details      || "");
    }

    const sets: string[] = [];
    const args: any[] = [];
    if (heading_name !== undefined) { sets.push("heading_name=?"); args.push(heading_name); }
    if (description  !== undefined) { sets.push("description=?");  args.push(description);  }
    if (link         !== undefined) { sets.push("link=?");         args.push(link);         }
    if (details      !== undefined) { sets.push("details=?");      args.push(details);      }
    if (pictureRel   !== undefined) { sets.push("picture=?");      args.push(pictureRel);   }
    if (!sets.length) return NextResponse.json({ ok: true, message: "nothing to update" });

    sets.push("updatedBy=?"); args.push(actor);
    sets.push("updatedDate=?"); args.push(now);

    await query(`UPDATE publications SET ${sets.join(", ")} WHERE id=?`, [...args, num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[publications:PATCH]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** DELETE */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const old = await query<{ picture: string | null }>("SELECT picture FROM publications WHERE id=? LIMIT 1", [num]);
    const oldRel = old[0]?.picture;
    if (oldRel) {
      const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
      fs.unlink(absOld).catch(() => void 0);
    }

    await query("DELETE FROM publications WHERE id=?", [num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[publications:DELETE]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
