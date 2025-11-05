// src/app/api/consultants/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/consultants/[id]
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "consultants", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const rows = await query<any>(
      `
      SELECT id, consultant_id, cat_name, name, fee, dcd,
             specialties, education, aoe, schedule,
             profile_pic, background_image, employment_status, doctor_type, consultant_type, status,
             updatedBy, updatedDate
      FROM consultant
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (err: any) {
    console.error("[consultants:[id]:GET] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

// PATCH /api/consultants/[id]
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "consultants", "edit")) {
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
        `UPDATE consultant
         SET status = CASE WHEN status='active' THEN 'inactive' ELSE 'active' END,
             updatedBy = ?, updatedDate = NOW()
         WHERE id = ?`,
        [actorEmail, id]
      );
      const s = await query<{ status: "active" | "inactive" }>(
        "SELECT status FROM consultant WHERE id = ? LIMIT 1",
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

    if (body.consultant_id !== undefined) set("consultant_id", String(body.consultant_id).trim());
    if (body.cat_name       !== undefined) set("cat_name",       String(body.cat_name).trim());
    if (body.name           !== undefined) set("name",           String(body.name).trim());
    if (body.fee            !== undefined) set("fee",            body.fee ?? null);
    if (body.dcd            !== undefined) set("dcd",            body.dcd ?? null);

    if (body.specialties    !== undefined) set("specialties", String(body.specialties || "").trim() || null);
    if (body.education      !== undefined) set("education",   String(body.education   || "").trim() || null);
    if (body.aoe !== undefined || body.expertise !== undefined) {
      set("aoe", String((body.aoe ?? body.expertise) || "").trim() || null);
    }
    if (body.experience !== undefined) {
      set("experience", String(body.experience || "").trim() || null);
    }

    if (body.schedule !== undefined) {
      try {
        set("schedule", JSON.stringify(body.schedule));
      } catch {
        set("schedule", null);
      }
    }

    if (body.profile_pic       !== undefined) set("profile_pic",       String(body.profile_pic || ""));
    if (body.background_image  !== undefined) set("background_image",  String(body.background_image || ""));
    if (body.employment_status !== undefined) set("employment_status", String(body.employment_status || ""));
    if (body.doctor_type       !== undefined) set("doctor_type",       String(body.doctor_type || ""));
    if (body.consultant_type   !== undefined) set("consultant_type",   String(body.consultant_type || "Physical"));
    if (body.status            !== undefined) {
      set("status", String(body.status).toLowerCase() === "active" ? "active" : "inactive");
    }

    set("updatedBy", actorEmail);
    fields.push("updatedDate = NOW()");

    if (!fields.length) {
      return NextResponse.json({ ok: true, message: "nothing to update" });
    }

    await query(`UPDATE consultant SET ${fields.join(", ")} WHERE id = ?`, [...paramsArr, id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[consultants:[id]:PATCH] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}

// DELETE /api/consultants/[id]
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "consultants", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    await query("DELETE FROM consultant WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[consultants:[id]:DELETE] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
