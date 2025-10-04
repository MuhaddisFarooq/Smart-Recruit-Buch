import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

async function actorFromSession() {
  const s = await getServerSession(authOptions).catch(() => null);
  return s?.user?.email || s?.user?.name || "system";
}

/** GET one */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const rows = await query<any>("SELECT * FROM testimonials WHERE id=? LIMIT 1", [num]);
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (e: any) {
    console.error("[testimonials:GET one]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** PATCH (toggle status OR update fields) */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const actor = await actorFromSession();
    const now = new Date();

    const maybeJson = await req.clone().json().catch(() => null);
    if (maybeJson && (maybeJson as any).toggleStatus) {
      const cur = await query<{ status: string }>("SELECT status FROM testimonials WHERE id=? LIMIT 1", [num]);
      if (!cur.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const next = cur[0].status === "active" ? "inactive" : "active";
      await query(
        "UPDATE testimonials SET status=?, updatedBy=?, updatedDate=? WHERE id=?",
        [next, actor, now, num]
      );
      return NextResponse.json({ ok: true, status: next });
    }

    const b: any = maybeJson ?? (await req.json().catch(() => ({})));
    const sets: string[] = [];
    const args: any[] = [];

    if (b.patient_name !== undefined) {
      sets.push("patient_name=?");
      args.push(String(b.patient_name || "").trim());
    }
    if (b.details !== undefined) {
      sets.push("details=?");
      args.push(String(b.details || "").trim());
    }
    if (b.video_link !== undefined) {
      sets.push("video_link=?");
      args.push(String(b.video_link || "").trim() || null);
    }
    if (b.status !== undefined) {
      const s = String(b.status || "").toLowerCase() === "inactive" ? "inactive" : "active";
      sets.push("status=?");
      args.push(s);
    }

    if (!sets.length) return NextResponse.json({ ok: true, message: "nothing to update" });

    sets.push("updatedBy=?");
    args.push(actor);
    sets.push("updatedDate=?");
    args.push(now);

    await query(`UPDATE testimonials SET ${sets.join(", ")} WHERE id=?`, [...args, num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[testimonials:PATCH]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** DELETE */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const num = Number(id);
    if (!Number.isFinite(num)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    await query("DELETE FROM testimonials WHERE id=?", [num]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[testimonials:DELETE]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
