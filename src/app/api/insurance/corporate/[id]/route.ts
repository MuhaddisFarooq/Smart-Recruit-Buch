// src/app/api/insurance/corporate/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { actorFromSession, saveCompressedJpeg } from "../../_helpers";
import path from "path";
import { promises as fs } from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";

// GET /api/insurance/corporate/[id]
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    // 🔒 Require "view"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "corporate", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const num = Number(id);
    if (!Number.isFinite(num)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const rows = await query<any>(
      "SELECT * FROM insurance_company_corporate WHERE id=? LIMIT 1",
      [num]
    );
    if (!rows?.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: rows[0] });
  } catch (err: any) {
    console.error("[insurance_corporate:GET one] DB error:", err);
    return NextResponse.json(
      { error: err?.message || "DB error" },
      { status: 500 }
    );
  }
}

// PATCH /api/insurance/corporate/[id]
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    // 🔒 Require "edit"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "corporate", "edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const num = Number(id);
    if (!Number.isFinite(num)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const ct = (req.headers.get("content-type") || "").toLowerCase();
    const updatedBy = await actorFromSession();
    const now = new Date();

    let name: string | undefined;
    let profile: string | undefined;
    let address: string | undefined;
    let logoRel: string | undefined;

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();

      if (form.has("name")) name = String(form.get("name") || "").trim();
      if (form.has("profile")) profile = String(form.get("profile") || "").trim();
      if (form.has("address")) address = String(form.get("address") || "").trim();

      const logoFile = form.get("logo") as File | null;
      if (logoFile && logoFile.size > 0) {
        // saveCompressedJpeg returns string | null -> coerce to undefined for our variable type
        const saved = await saveCompressedJpeg(logoFile, "corporate");
        logoRel = saved ?? undefined;

        // delete existing file if present
        const old = await query<{ logo: string | null }>(
          "SELECT logo FROM insurance_company_corporate WHERE id=? LIMIT 1",
          [num]
        );
        const oldRel = old[0]?.logo;
        if (oldRel) {
          const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
          fs.unlink(absOld).catch(() => void 0);
        }
      }
    } else {
      const b = await req.json().catch(() => ({} as any));
      if (b.name !== undefined) name = String(b.name || "").trim();
      if (b.profile !== undefined) profile = String(b.profile || "").trim();
      if (b.address !== undefined) address = String(b.address || "").trim();
      // no logo in JSON branch
    }

    const sets: string[] = [];
    const args: any[] = [];
    if (name !== undefined) { sets.push("name=?"); args.push(name); }
    if (profile !== undefined) { sets.push("profile=?"); args.push(profile); }
    if (address !== undefined) { sets.push("address=?"); args.push(address); }
    if (logoRel !== undefined) { sets.push("logo=?"); args.push(logoRel); }

    // If nothing changed, don't write updatedBy/updatedDate
    if (sets.length === 0) {
      return NextResponse.json({ ok: true, message: "nothing to update" });
    }

    sets.push("updatedBy=?"); args.push(updatedBy);
    sets.push("updatedDate=?"); args.push(now);

    await query(
      `UPDATE insurance_company_corporate SET ${sets.join(", ")} WHERE id=?`,
      [...args, num]
    );
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[insurance_corporate:PATCH] DB error:", err);
    return NextResponse.json(
      { error: err?.message || "DB error" },
      { status: 500 }
    );
  }
}

// DELETE /api/insurance/corporate/[id]
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    // 🔒 Require "delete"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "corporate", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const num = Number(id);
    if (!Number.isFinite(num)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    // remove logo from disk if present
    const old = await query<{ logo: string | null }>(
      "SELECT logo FROM insurance_company_corporate WHERE id=? LIMIT 1",
      [num]
    );
    const oldRel = old[0]?.logo;
    if (oldRel) {
      const absOld = path.join(process.cwd(), "public", "uploads", oldRel);
      fs.unlink(absOld).catch(() => void 0);
    }

    await query("DELETE FROM insurance_company_corporate WHERE id=?", [num]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[insurance_corporate:DELETE] DB error:", err);
    return NextResponse.json(
      { error: err?.message || "DB error" },
      { status: 500 }
    );
  }
}
