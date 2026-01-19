// src/lib/auth/options.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query, execute } from "@/lib/db";

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

        try {
          // 1. Check Local DB First
          const rows = await query<DBUser>(
            "SELECT id, email, name, password, role, status, group_id FROM users WHERE email = ? LIMIT 1",
            [email]
          ).catch(() => [] as any);

          let u = rows[0];

          // If user exists locally, try to verify password
          if (u && u.password) {
            const isValid = await bcrypt.compare(password, u.password);
            if (isValid) {
              if ((u.status || "active") !== "active") {
                throw new Error("Account is inactive");
              }
              // Return local user immediately if password matches
              // This handles Candidates and regular local users
              const perms = await loadPermissionMapForUser(u).catch(() => ({} as PermissionMap));
              return {
                id: String(u.id),
                name: u.name || u.email,
                email: u.email,
                role: u.role || "candidate", // Default to candidate if role is missing
                group_id: u.group_id ?? null,
                perms,
              } as any;
            }
          }

          // 2. If Local Auth Failed (User not found OR Password mismatch), Try External API
          // Only proceed if password didn't match local hash (for admins/employees using external credentials)

          let extUser = null;
          try {
            const params = new URLSearchParams();
            params.append("email", email);
            params.append("password", password);

            const apiRes = await fetch(`https://buchhospital.com/ppapi/dash_auth.php?${params.toString()}`, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json, */*",
                "Connection": "keep-alive"
              }
            });

            if (apiRes.ok) {
              const apiData = await apiRes.json();
              if (Array.isArray(apiData) && apiData.length > 0) {
                extUser = apiData[0];
              }
            }
          } catch (fetchError) {
            console.error("External Auth API Failed:", fetchError);
            // Do NOT throw error here, just let extUser be null
          }

          if (extUser && extUser.emp_id) {
            // External Auth Success - Sync with Local DB
            if (u) {
              // User exists: Update details
              await query(
                `UPDATE users SET 
                     emp_id = ?, 
                     name = ?, 
                     department = ?, 
                     designation = ?, 
                     position = ?, 
                     avatar_url = ? 
                     WHERE id = ?`,
                [
                  extUser.emp_id,
                  extUser.name,
                  extUser.department,
                  extUser.designation,
                  extUser.designation,
                  extUser.profile_pic,
                  u.id
                ]
              );
              // Update local object for the session
              u.name = extUser.name;
            } else {
              // User does not exist: Create new user (Auto-Provisioning)
              const insertRes = await execute(
                `INSERT INTO users (email, password, name, emp_id, department, designation, position, avatar_url, role, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'admin', 'active')`,
                [
                  email,
                  "$2a$10$dummyhashformigratedusers00000000000000000000000000", // Dummy bcrypt hash
                  extUser.name,
                  extUser.emp_id,
                  extUser.department,
                  extUser.designation,
                  extUser.designation,
                  extUser.profile_pic
                ]
              );

              u = {
                id: insertRes.insertId,
                email: email,
                name: extUser.name,
                password: "EXTERNAL_AUTH",
                role: "admin",
                status: "active",
                group_id: null
              };
            }

            if ((u.status || "active") !== "active") {
              throw new Error("Account is inactive");
            }

            const finalRole = (u.role && u.role !== 'candidate') ? u.role : 'admin';
            const perms = await loadPermissionMapForUser(u).catch(() => ({} as PermissionMap));

            return {
              id: String(u.id),
              name: u.name || u.email,
              email: u.email,
              role: finalRole,
              group_id: u.group_id ?? null,
              perms,
            } as any;
          }

          // If we reached here:
          // 1. Local auth failed (or user not found)
          // 2. External auth failed (or API error)
          return null;

        } catch (error) {
          console.error("Authorize Error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // Add ID to token
        token.role = (user as any).role || "user";
        token.group_id = (user as any).group_id ?? null;
        token.perms = (user as any).perms || {};
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub; // Add ID to session
        (session.user as any).role = token.role || "user";
        (session.user as any).group_id = (token as any).group_id ?? null;
        (session.user as any).perms = (token as any).perms || {};
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
