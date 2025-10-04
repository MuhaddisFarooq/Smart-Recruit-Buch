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
  const folder = path.join(process.cwd(), "public", "uploads", "hr-training");
  await ensureDir(folder);
  const base = sanitize(file.name || "training.jpg").replace(/\.(png|webp|gif|bmp|tiff)$/i, ".jpg");
  const out = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${base}`;
  const abs = path.join(folder, out);
  await sharp(buf).rotate().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(abs);
  return `hr-training/${out}`;
}

// same normalization used here on PATCH
function normalizeMulti(input: unknown): string {
  const items = String(input ?? "")
    .split(/[\n,]+/g)
    .map(s => s.trim())
    .filter(Boolean);
  return items.join("\n");
}

/** GET one */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const rows = await query<any>("SELECT * FROM hr_trainings WHERE id=? LIMIT 1", [num]);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (e: any) {
    console.error("[hr-training:GET one]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** PATCH one (multipart or JSON) */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const actor = await actorFromSession();
    const now = new Date();

    const ct = (req.headers.get("content-type") || "").toLowerCase();

    let title: string | undefined;
    let dateStr: string | undefined;
    let time: string | undefined;
    let duration: string | undefined;
    let trainer: string | undefined;
    let participants: string | undefined;
    let t_agenda: string | undefined;       // HTML
    let department: string | undefined;
    let t_type: string | undefined;
    let t_certificate: string | undefined;
    let imageRel: string | undefined;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      if (fd.has("title"))        title        = String(fd.get("title") || "");
      if (fd.has("date"))         dateStr      = String(fd.get("date") || "");
      if (fd.has("time"))         time         = String(fd.get("time") || "");
      if (fd.has("duration"))     duration     = String(fd.get("duration") || "");
      if (fd.has("trainer"))      trainer      = normalizeMulti(fd.get("trainer"));
      if (fd.has("participants")) participants = normalizeMulti(fd.get("participants"));
      if (fd.has("t_agenda"))     t_agenda     = String(fd.get("t_agenda") ?? ""); // keep HTML
      if (fd.has("department"))   department   = String(fd.get("department") || "");
      if (fd.has("t_type"))       t_type       = String(fd.get("t_type") || "");
      if (fd.has("t_certificate"))t_certificate= String(fd.get("t_certificate") || "");

      const file = fd.get("image") as File | null;
      if (file && file.size > 0) {
        imageRel = await saveCompressedJpeg(file);
        // delete old
        const old = await query<{ image: string | null }>("SELECT image FROM hr_trainings WHERE id=? LIMIT 1", [num]);
        const oldRel = old[0]?.image;
        if (oldRel) {
          const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
          fs.unlink(absOld).catch(() => void 0);
        }
      }
    } else {
      const b: any = await req.json().catch(() => ({}));
      if ("title" in b)         title        = String(b.title || "");
      if ("date" in b)          dateStr      = String(b.date || "");
      if ("time" in b)          time         = String(b.time || "");
      if ("duration" in b)      duration     = String(b.duration || "");
      if ("trainer" in b)       trainer      = normalizeMulti(b.trainer);
      if ("participants" in b)  participants = normalizeMulti(b.participants);
      if ("t_agenda" in b)      t_agenda     = String(b.t_agenda ?? ""); // keep HTML
      if ("department" in b)    department   = String(b.department || "");
      if ("t_type" in b)        t_type       = String(b.t_type || "");
      if ("t_certificate" in b) t_certificate= String(b.t_certificate || "");
      // JSON can't carry image
    }

    const sets: string[] = [];
    const args: any[] = [];
    if (title !== undefined)        { sets.push("title=?");        args.push(title); }
    if (dateStr !== undefined)      { sets.push("date=?");         args.push(dateStr ? new Date(dateStr) : null); }
    if (time !== undefined)         { sets.push("time=?");         args.push(time); }
    if (duration !== undefined)     { sets.push("duration=?");     args.push(duration); }
    if (trainer !== undefined)      { sets.push("trainer=?");      args.push(trainer); }
    if (participants !== undefined) { sets.push("participants=?"); args.push(participants); }
    if (t_agenda !== undefined)     { sets.push("t_agenda=?");     args.push(t_agenda); } // HTML verbatim
    if (department !== undefined)   { sets.push("department=?");   args.push(department); }
    if (t_type !== undefined)       { sets.push("t_type=?");       args.push(t_type); }
    if (t_certificate !== undefined){ sets.push("t_certificate=?");args.push(t_certificate); }
    if (imageRel !== undefined)     { sets.push("image=?");        args.push(imageRel); }

    if (!sets.length) return NextResponse.json({ ok: true, message: "nothing to update" });

    sets.push("updatedBy=?");   args.push(actor);
    sets.push("updatedDate=?"); args.push(now);

    await query(`UPDATE hr_trainings SET ${sets.join(", ")} WHERE id=?`, [...args, num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[hr-training:PATCH]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** DELETE one */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const old = await query<{ image: string | null }>("SELECT image FROM hr_trainings WHERE id=? LIMIT 1", [num]);
    const oldRel = old[0]?.image;
    if (oldRel) {
      const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
      fs.unlink(absOld).catch(() => void 0);
    }
    await query("DELETE FROM hr_trainings WHERE id=?", [num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[hr-training:DELETE]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
