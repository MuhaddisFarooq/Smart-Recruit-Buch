// src/lib/auth/options.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

// Keep this in server-only code. Do NOT import in client bundles.
export type PermAction = "view" | "new" | "edit" | "delete" | "export" | "import";
export type PermissionMap = {
  [moduleKey: string]: Partial<Record<PermAction, boolean>>;
};

type DBUser = {
  id: number;
  email: string;
  name: string | null;
  password: string;
  role: string | null;
  status: string | null;
  group_id?: number | null;
};

async function tableExists(name: string) {
  try {
    // Method 1: Use DESCRIBE to check if table exists (most reliable)
    try {
      await query<any>(`DESCRIBE \`${name}\``);
      return true;
    } catch (describeError) {
      // DESCRIBE failed, try fallback method
    }

    // Method 2: Fallback - get all tables and check
    const rows = await query<any>("SHOW TABLES");
    const tableNames = rows.map((row: any) => Object.values(row)[0] as string);
    const exists = tableNames.includes(name);

    return exists;
  } catch (error) {
    return false;
  }
}

// 1) Preferred: load from user_groups.permissions (JSON) via users.group_id
async function loadPermsFromGroupsTable(groupId: number | null | undefined): Promise<PermissionMap | null> {
  if (!groupId) {
    return null;
  }

  const hasGroups = await tableExists("user_groups");
  if (!hasGroups) {
    return null;
  }

  try {
    const rows = await query<{ permissions: any }>(
      "SELECT permissions FROM user_groups WHERE id = ? LIMIT 1",
      [groupId]
    );
    const raw = rows[0]?.permissions;
    if (!raw) {
      return {};
    }
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" ? (parsed as PermissionMap) : {};
  } catch (error) {
    return {};
  }
}

// 2) Legacy: load from user_group_permissions + user_group_members (if present)
async function loadPermsFromLegacyTables(userId: number): Promise<PermissionMap | null> {
  const hasPerms = await tableExists("user_group_permissions");
  const hasMembers = await tableExists("user_group_members");
  if (!hasPerms || !hasMembers) return null;

  try {
    const rows = await query<{
      module_key: string;
      can_view: any; can_new: any; can_edit: any; can_delete: any; can_export: any;
    }>(
      `SELECT p.module_key,
              MAX(p.can_view)   AS can_view,
              MAX(p.can_new)    AS can_new,
              MAX(p.can_edit)   AS can_edit,
              MAX(p.can_delete) AS can_delete,
              MAX(p.can_export) AS can_export
       FROM user_group_permissions p
       JOIN user_group_members m ON m.group_id = p.group_id
       WHERE m.user_id = ?
       GROUP BY p.module_key`,
      [userId]
    );

    const out: PermissionMap = {};
    for (const r of rows) {
      out[r.module_key] = {
        view: !!r.can_view,
        new: !!r.can_new,
        edit: !!r.can_edit,
        delete: !!r.can_delete,
        export: !!r.can_export,
      };
    }
    return out;
  } catch {
    return {};
  }
}

async function loadPermissionMapForUser(u: DBUser): Promise<PermissionMap> {
  // Try (A) group JSON
  const fromGroup = await loadPermsFromGroupsTable(u.group_id);
  if (fromGroup) return fromGroup;

  // Try (B) legacy mapping tables
  const fromLegacy = await loadPermsFromLegacyTables(u.id);
  if (fromLegacy) return fromLegacy;

  // (C) Role fallback
  const role = (u.role || "").toLowerCase();
  if (role === "superadmin") {
    const adminPerms = { "*": { view: true, new: true, edit: true, delete: true, export: true, import: true } };
    return adminPerms;
  }
  return {};
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = String(creds?.email || "").trim().toLowerCase();
        const password = String(creds?.password || "");

        if (!email || !password) {
          throw new Error("Missing credentials");
        }

        // Pull user (ensure email is compared lower-case)
        const rows = await query<DBUser>(
          "SELECT id, email, name, password, role, status, group_id FROM users WHERE email = ? LIMIT 1",
          [email]
        ).catch(() => [] as any);

        const u = rows[0];
        if (!u) return null;                 // NextAuth returns generic error
        if ((u.status || "active") !== "active") {
          throw new Error("Account is inactive");
        }

        const ok = await bcrypt.compare(password, u.password);
        if (!ok) return null;

        // Load permissions (never throw)
        const perms = await loadPermissionMapForUser(u).catch((error) => {
          return {} as PermissionMap;
        });

        return {
          id: String(u.id),
          name: u.name || u.email,
          email: u.email,
          role: u.role || "user",
          group_id: u.group_id ?? null,
          perms,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "user";
        token.group_id = (user as any).group_id ?? null;
        token.perms = (user as any).perms || {};
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role = token.role || "user";
      (session.user as any).group_id = (token as any).group_id ?? null;
      (session.user as any).perms = (token as any).perms || {};
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
