import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const session = await getServerSession(authOptions).catch(() => null);
  return session?.user?.email || session?.user?.name || "system";
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}
async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}
async function saveCompressedJpeg(file: File): Promise<string> {
  const arr = await file.arrayBuffer();
  const input = Buffer.from(arr as ArrayBuffer);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "executive");
  await ensureDir(uploadsDir);

  const base = sanitizeName(file.name || "image.jpg");
  const outName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}`.replace(
    /\.(png|webp|gif|bmp|tiff)$/i,
    ".jpg"
  );
  const absOut = path.join(uploadsDir, outName);
  await sharp(input).rotate().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(absOut);
  return `executive/${outName}`;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const rows = await query<any>(`SELECT * FROM executive_health_checkups WHERE id=? LIMIT 1`, [num]);
    if (!rows?.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err: any) {
    console.error("[ehc:GET one] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const num = Number(id);
    if (!Number.isFinite(num)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    const actor = await actorFromSession();
    const now = new Date();

    // --- Read JSON ONCE (if JSON) and handle toggle early ---
    let jsonBody: any | null = null;
    if (ct.includes("application/json")) {
      jsonBody = await req.json().catch(() => null);
      if (jsonBody?.toggleStatus) {
        // flip status and update audit fields
        const cur = await query<{ status: string }>(
          "SELECT status FROM executive_health_checkups WHERE id=? LIMIT 1",
          [num]
        );
        if (!cur.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const next = cur[0].status === "active" ? "inactive" : "active";
        await query(
          `UPDATE executive_health_checkups
             SET status=?, updatedBy=?, updatedDate=?
           WHERE id=?`,
          [next, actor, now, num]
        );
        return NextResponse.json({ ok: true, status: next });
      }
    }

    // --- Regular update paths ---
    let title: string | undefined;
    let price_label: string | undefined;
    let imageRel: string | undefined;
    let consultations: string | undefined;
    let cardiology_tests: string | undefined;
    let radiology_tests: string | undefined;
    let lab_tests_left: string | undefined;
    let lab_tests_right: string | undefined;
    let instructions: string | undefined;
    let status: string | undefined;

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();

      if (form.has("title")) title = String(form.get("title") || "").trim();
      if (form.has("price_label")) price_label = String(form.get("price_label") || "").trim();
      if (form.has("consultations")) consultations = String(form.get("consultations") || "").trim();
      if (form.has("cardiology_tests")) cardiology_tests = String(form.get("cardiology_tests") || "").trim();
      if (form.has("radiology_tests")) radiology_tests = String(form.get("radiology_tests") || "").trim();
      if (form.has("lab_tests_left")) lab_tests_left = String(form.get("lab_tests_left") || "").trim();
      if (form.has("lab_tests_right")) lab_tests_right = String(form.get("lab_tests_right") || "").trim();
      if (form.has("instructions")) instructions = String(form.get("instructions") || "").trim();
      if (form.has("status")) status = String(form.get("status") || "").trim();

      const imageFile = form.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        imageRel = await saveCompressedJpeg(imageFile);

        // delete old image
        const old = await query<{ image: string | null }>(
          "SELECT image FROM executive_health_checkups WHERE id=? LIMIT 1",
          [num]
        );
        const oldRel = old[0]?.image;
        if (oldRel) {
          const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
          fs.unlink(absOld).catch(() => void 0);
        }
      }
    } else if (jsonBody) {
      // regular JSON update (not a toggle)
      const b = jsonBody;
      if (b.title !== undefined) title = String(b.title || "").trim();
      if (b.price_label !== undefined) price_label = String(b.price_label || "").trim();
      if (b.consultations !== undefined) consultations = String(b.consultations || "").trim();
      if (b.cardiology_tests !== undefined) cardiology_tests = String(b.cardiology_tests || "").trim();
      if (b.radiology_tests !== undefined) radiology_tests = String(b.radiology_tests || "").trim();
      if (b.lab_tests_left !== undefined) lab_tests_left = String(b.lab_tests_left || "").trim();
      if (b.lab_tests_right !== undefined) lab_tests_right = String(b.lab_tests_right || "").trim();
      if (b.instructions !== undefined) instructions = String(b.instructions || "").trim();
      if (b.status !== undefined) status = String(b.status || "").trim();
      // (no image in JSON path)
    }

    const sets: string[] = [];
    const args: any[] = [];
    if (title !== undefined) { sets.push("title=?"); args.push(title); }
    if (price_label !== undefined) { sets.push("price_label=?"); args.push(price_label); }
    if (imageRel !== undefined) { sets.push("image=?"); args.push(imageRel); }
    if (consultations !== undefined) { sets.push("consultations=?"); args.push(consultations); }
    if (cardiology_tests !== undefined) { sets.push("cardiology_tests=?"); args.push(cardiology_tests); }
    if (radiology_tests !== undefined) { sets.push("radiology_tests=?"); args.push(radiology_tests); }
    if (lab_tests_left !== undefined) { sets.push("lab_tests_left=?"); args.push(lab_tests_left); }
    if (lab_tests_right !== undefined) { sets.push("lab_tests_right=?"); args.push(lab_tests_right); }
    if (instructions !== undefined) { sets.push("instructions=?"); args.push(instructions); }
    if (status !== undefined) { sets.push("status=?"); args.push(status); }

    if (!sets.length) {
      return NextResponse.json({ ok: true, message: "nothing to update" });
    }

    sets.push("updatedBy=?"); args.push(actor);
    sets.push("updatedDate=?"); args.push(now);

    await query(`UPDATE executive_health_checkups SET ${sets.join(", ")} WHERE id=?`, [...args, num]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[ehc:PATCH] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
