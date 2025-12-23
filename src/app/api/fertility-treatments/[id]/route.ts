// src/app/api/fertility-treatments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import path from "path";
import { promises as fs } from "fs";
import { saveOptimizedImage } from "../../_helpers/image-processing";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ✅ Use env if you have it. Fallbacks keep it compatible with your current setup.
const UPLOADS_ROOT =
  process.env.BUCH_UPLOADS_DIR ||
  process.env.UPLOADS_DIR ||
  path.join(process.cwd(), "public", "uploads");

// Normalize stored paths like:
// "fertility/abc.jpg" OR "/uploads/fertility/abc.jpg" OR "uploads/fertility/abc.jpg"
function normalizeUploadRel(p: string) {
  return String(p || "")
    .replace(/^https?:\/\/[^/]+\/uploads\//i, "") // if full URL stored
    .replace(/^\/?uploads\//i, "")               // remove leading uploads/
    .replace(/^\/+/, "");                        // remove leading slashes
}

// Safe unlink (no throw)
async function safeUnlink(absPath: string) {
  try {
    await fs.unlink(absPath);
  } catch {
    // ignore
  }
}

async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}

/**
 * ✅ PUBLIC GET (for website)
 * This fixes your 401 on test.buchhospital.com.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const num = Number(id);
    if (!Number.isFinite(num)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const rows = await query<any>(
      "SELECT * FROM fertility_treatments WHERE id=? LIMIT 1",
      [num]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (e: any) {
    console.error("[fertility:GET one]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/**
 * 🔒 PATCH (admin only)
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "fertility_treatment", "edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const actor = await actorFromSession();
    const now = new Date();

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    let title: string | undefined;
    let details: string | undefined;
    let description_html: string | undefined;
    let imageRel: string | undefined;
    let status: string | undefined;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      if (fd.has("title")) title = String(fd.get("title") || "");
      if (fd.has("details")) details = String(fd.get("details") || "");
      if (fd.has("description_html")) description_html = String(fd.get("description_html") || "");
      if (fd.has("status")) status = String(fd.get("status") || "");

      const file = fd.get("image") as File | null;
      if (file && file.size > 0) {
        // Save new image (your helper decides the final storage)
        imageRel = await saveOptimizedImage(file, "fertility", null, 98);

        // Delete old image (best-effort, safe)
        const old = await query<{ image: string | null }>(
          "SELECT image FROM fertility_treatments WHERE id=? LIMIT 1",
          [num]
        );
        const oldRel = old[0]?.image;
        if (oldRel) {
          const rel = normalizeUploadRel(oldRel);
          await safeUnlink(path.join(UPLOADS_ROOT, rel));
          // (Optional extra backward-compat attempt)
          await safeUnlink(path.join(process.cwd(), "public", "uploads", rel));
        }
      }
    } else {
      const b: any = await req.json().catch(() => ({}));
      if (b.title !== undefined) title = String(b.title || "");
      if (b.details !== undefined) details = String(b.details || "");
      if (b.description_html !== undefined) description_html = String(b.description_html || "");
      if (b.status !== undefined) status = String(b.status);

      // Simple toggle logic helper
      if (b.toggleStatus) {
        const old = await query<{ status: string }>(
          "SELECT status FROM fertility_treatments WHERE id=? LIMIT 1",
          [num]
        );
        const current = old[0]?.status || "active";
        status = current === "active" ? "inactive" : "active";
      }
    }

    const sets: string[] = [];
    const args: any[] = [];

    if (title !== undefined) {
      sets.push("title=?");
      args.push(title);
    }
    if (details !== undefined) {
      sets.push("details=?");
      args.push(details || null);
    }
    if (description_html !== undefined) {
      sets.push("description_html=?");
      args.push(description_html || null);
    }
    if (status !== undefined) {
      sets.push("status=?");
      args.push(status);
    }
    if (imageRel !== undefined) {
      sets.push("image=?");
      args.push(imageRel);
    }

    if (!sets.length) {
      return NextResponse.json({ ok: true, message: "nothing to update" });
    }

    sets.push("updatedBy=?");
    args.push(actor);
    sets.push("updatedDate=?");
    args.push(now);

    await query(
      `UPDATE fertility_treatments SET ${sets.join(", ")} WHERE id=?`,
      [...args, num]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[fertility:PATCH]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/**
 * 🔒 DELETE (admin only)
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "fertility_treatment", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const old = await query<{ image: string | null }>(
      "SELECT image FROM fertility_treatments WHERE id=? LIMIT 1",
      [num]
    );

    const oldRel = old[0]?.image;
    if (oldRel) {
      const rel = normalizeUploadRel(oldRel);
      await safeUnlink(path.join(UPLOADS_ROOT, rel));
      // backward-compat attempt
      await safeUnlink(path.join(process.cwd(), "public", "uploads", rel));
    }

    await query("DELETE FROM fertility_treatments WHERE id=?", [num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[fertility:DELETE]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
