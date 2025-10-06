import { NextRequest, NextResponse } from "next/server";
import { pool, query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { MODULES, ModuleKey } from "@/lib/modules";

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

/** GET - list groups; use JSON permissions column */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const where = q ? "WHERE name LIKE ?" : "";
    const args: any[] = q ? [`%${q}%`] : [];

    const rows = await query<any>(
      `SELECT id, name, addedBy, addedDate, updatedBy, updatedDate, permissions
       FROM user_groups 
       ${where}
       ORDER BY id DESC`,
      args
    );

    // Add modulesWithAccess count for backward compatibility
    const processedRows = rows.map((row: any) => {
      let modulesWithAccess = 0;
      try {
        const perms = row.permissions ? JSON.parse(row.permissions) : {};
        modulesWithAccess = Object.keys(perms).length;
      } catch (e) {
        console.warn("Failed to parse permissions for group", row.id, e);
      }
      return { ...row, modulesWithAccess };
    });

    return NextResponse.json({ data: processedRows });
  } catch (e: any) {
    console.error("[user-groups:GET]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}

/** POST - create a group (superadmin only) */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const actor = auth.actor;
  const now = new Date();

  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const perms: IncomingPerms<ModuleKey> = (body?.permissions ?? {}) as IncomingPerms<ModuleKey>;
    if (!name) return NextResponse.json({ error: "Group name is required" }, { status: 400 });

    console.log("📝 Creating user group:", { name, permissions: perms });

    // Convert permissions to JSON format for storage
    const validKeys = new Set(MODULES.map((m) => m.key));
    const permissionsJson: Record<string, any> = {};

    for (const [k, v] of Object.entries(perms) as [ModuleKey, PermSet][]) {
      if (!validKeys.has(k)) continue;
      
      // Only include modules that have at least one permission enabled
      const modulePerms: Record<string, boolean> = {};
      if (v?.view) modulePerms.view = true;
      if (v?.new) modulePerms.new = true;
      if (v?.edit) modulePerms.edit = true;
      if (v?.delete) modulePerms.delete = true;
      if (v?.export) modulePerms.export = true;

      if (Object.keys(modulePerms).length > 0) {
        permissionsJson[k] = modulePerms;
      }
    }

    const permissionsString = JSON.stringify(permissionsJson);
    console.log("💾 Storing permissions JSON:", permissionsString);

    const res: any = await query(
      `INSERT INTO user_groups (name, addedBy, addedDate, permissions) VALUES (?, ?, ?, ?)`,
      [name, actor, now, permissionsString]
    );

    const groupId = res?.insertId as number;
    console.log("✅ Created user group with ID:", groupId);

    return NextResponse.json({ ok: true, id: groupId });
  } catch (e: any) {
    console.error("[user-groups:POST]", e);
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 });
  }
}
