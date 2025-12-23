import { NextRequest, NextResponse } from "next/server";
import { pool, query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { MODULES, ModuleKey } from "@/lib/modules";
import { hasPerm } from "@/lib/perms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PermSet = { new?: boolean; edit?: boolean; delete?: boolean; view?: boolean; export?: boolean };
type IncomingPerms<K extends string> = Partial<Record<K, PermSet>>;

async function requireSuperAdmin() {
  const s = await getServerSession(authOptions).catch(() => null);
  if (!s?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  if ((s.user as any).role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return { actor: (s.user.email || s.user.name || "system") as string } as const;
}

/** GET one */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const gid = Number(id);
  if (!Number.isFinite(gid)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  try {
    // 🔒 Require "view" (users module)
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const perms = (session.user as any)?.perms;
    if (!hasPerm(perms, "users", "view")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [group] = await query<any>(`SELECT * FROM user_groups WHERE id=? LIMIT 1`, [gid]);
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Parse permissions from JSON column
    let permissions = {};
    try {
      if (group.permissions) {
        permissions = JSON.parse(group.permissions);
      }
    } catch (e) {
      console.warn("Failed to parse permissions for group", gid, e);
    }

    console.log("📖 Retrieved group permissions:", { groupId: gid, permissions });

    return NextResponse.json({ data: { group, permissions } });
  } catch (e: any) {
    console.error("[user-groups:GET one]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** PATCH - replace permissions + update name */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const gid = Number(id);
  if (!Number.isFinite(gid)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  // 🔒 Require "edit" (users module)
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userPerms = (session.user as any)?.perms;
  if (!hasPerm(userPerms, "users", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const actor = session.user?.email || session.user?.name || "system";
  const now = new Date();

  try {
    const body = await req.json().catch(() => ({}));
    const name = "name" in body ? String(body.name || "").trim() : undefined;
    const perms: IncomingPerms<ModuleKey> = (body?.permissions ?? {}) as IncomingPerms<ModuleKey>;

    // Convert permissions to JSON string
    const permissionsJson = perms ? JSON.stringify(perms) : null;

    console.log("📝 Updating group permissions:", {
      groupId: gid,
      name,
      permissions: perms,
      permissionsJson: permissionsJson ? (permissionsJson.length > 200 ? permissionsJson.substring(0, 200) + '...' : permissionsJson) : null
    });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (name !== undefined) {
        await conn.execute(
          `UPDATE user_groups SET name=?, permissions=?, updatedBy=?, updatedDate=? WHERE id=?`,
          [name, permissionsJson, actor, now, gid]
        );
      } else {
        await conn.execute(`UPDATE user_groups SET permissions=?, updatedBy=?, updatedDate=? WHERE id=?`, [permissionsJson, actor, now, gid]);
      }

      await conn.commit();
      return NextResponse.json({ ok: true });
    } catch (e) {
      try { await (await conn).rollback(); } catch { }
      throw e;
    } finally {
      conn.release();
    }
  } catch (e: any) {
    console.error("[user-groups:PATCH]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** DELETE */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const gid = Number(id);
  if (!Number.isFinite(gid)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  // 🔒 Require "delete" (users module)
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const perms = (session.user as any)?.perms;
  if (!hasPerm(perms, "users", "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Just delete the user group - permissions are stored as JSON in the same row
      await conn.execute(`DELETE FROM user_groups WHERE id=?`, [gid]);
      await conn.commit();

      console.log("🗑️ Deleted user group:", { groupId: gid });

      return NextResponse.json({ ok: true });
    } catch (e) {
      try { await (await conn).rollback(); } catch { }
      throw e;
    } finally {
      conn.release();
    }
  } catch (e: any) {
    console.error("[user-groups:DELETE]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
