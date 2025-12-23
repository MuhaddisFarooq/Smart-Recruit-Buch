import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";

/** DELETE one */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 Require "delete"
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "achievements", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await ctx.params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Bad id" }, { status: 400 });
    }

    const rows = await query<{ image: string }>(
      "SELECT image FROM achievements WHERE id=? LIMIT 1",
      [id]
    );
    const rel = rows[0]?.image;
    if (rel) {
      const abs = path.join(process.cwd(), "public", "uploads", rel);
      fs.unlink(abs).catch(() => void 0); // best effort
    }

    await query("DELETE FROM achievements WHERE id=?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[achievements:DELETE] DB error:", err);
    return NextResponse.json({ error: err?.message || "DB error" }, { status: 500 });
  }
}
