// src/app/api/careers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const session = await getServerSession(authOptions).catch(() => null);
  return session?.user?.email || session?.user?.name || "system";
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 Require "view"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "careers", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const rows = await query<any>(`SELECT * FROM careers WHERE id = ? LIMIT 1`, [id]);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err: any) {
    console.error("[careers:[id]:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await ctx.params;

    // 🔒 Require "edit"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "careers", "edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = Number(idStr);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const actorEmail = await actorFromSession();

    // Toggle status quickly
    if (b?.toggleStatus) {
      await query(
        `UPDATE careers
         SET status = CASE WHEN status='active' THEN 'inactive' ELSE 'active' END,
             updatedBy = ?, updatedDate = NOW()
         WHERE id = ?`,
        [actorEmail, id]
      );
      const s = await query<{ status: "active" | "inactive" }>(
        "SELECT status FROM careers WHERE id = ? LIMIT 1",
        [id]
      );
      return NextResponse.json({ ok: true, status: s[0]?.status ?? "inactive" });
    }

    // Field updates
    const fields: string[] = [];
    const values: any[] = [];
    const set = (col: string, val: any) => { fields.push(`${col} = ?`); values.push(val); };

    if (b.job_title !== undefined) set("job_title", String(b.job_title).trim());
    if (b.type_of_employment !== undefined) set("type_of_employment", String(b.type_of_employment).trim());
    if (b.department !== undefined) set("department", String(b.department).trim());
    if (b.location !== undefined) set("location", String(b.location).trim());
    if (b.job_link !== undefined) set("job_link", String(b.job_link ?? ""));
    if (b.status !== undefined) set("status", String(b.status || "active"));

    set("updatedBy", actorEmail);
    fields.push("updatedDate = NOW()");

    if (!fields.length) return NextResponse.json({ ok: true, message: "nothing to update" });

    await query(`UPDATE careers SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[careers:[id]:PATCH] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await ctx.params;

    // 🔒 Require "delete"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "careers", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = Number(idStr);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    await query("DELETE FROM careers WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[careers:[id]:DELETE] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
