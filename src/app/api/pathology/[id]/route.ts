// src/app/api/pathology/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/pathology/[id]
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "pathology", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const rows = await query<any>(
      `
      SELECT id, test_name, price, department, status,
             addedBy, addedDate, updatedBy, updatedDate
      FROM pathology
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err: any) {
    console.error("[pathology:[id]:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

// PATCH /api/pathology/[id]
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "pathology", "edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const actorEmail = session.user?.email || session.user?.name || "unknown";
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // Toggle status
    if (body?.toggleStatus) {
      await query(
        `UPDATE pathology
         SET status = CASE WHEN status='active' THEN 'inactive' ELSE 'active' END,
             updatedBy = ?, updatedDate = NOW()
         WHERE id = ?`,
        [actorEmail, id]
      );
      const s = await query<{ status: "active" | "inactive" }>(
        "SELECT status FROM pathology WHERE id = ? LIMIT 1",
        [id]
      );
      return NextResponse.json({ ok: true, status: s[0]?.status ?? "inactive" });
    }

    // Field updates
    const fields: string[] = [];
    const paramsArr: any[] = [];
    const set = (col: string, val: any) => {
      fields.push(`${col} = ?`);
      paramsArr.push(val);
    };

    if (body.test_name !== undefined) set("test_name", String(body.test_name).trim());
    if (body.price !== undefined) set("price", body.price ?? null);
    if (body.department !== undefined) set("department", String(body.department ?? "").trim() || null);
    if (body.status !== undefined) {
      set("status", String(body.status).toLowerCase() === "active" ? "active" : "inactive");
    }

    set("updatedBy", actorEmail);
    fields.push("updatedDate = NOW()");

    if (!fields.length) {
      return NextResponse.json({ ok: true, message: "nothing to update" });
    }

    await query(`UPDATE pathology SET ${fields.join(", ")} WHERE id = ?`, [...paramsArr, id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[pathology:[id]:PATCH] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

// DELETE /api/pathology/[id]
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "pathology", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    await query("DELETE FROM pathology WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[pathology:[id]:DELETE] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
