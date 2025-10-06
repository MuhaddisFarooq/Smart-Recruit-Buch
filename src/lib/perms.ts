// src/lib/perms.ts
// Server-side permission utilities (with auth imports)
import { PermissionMap, PermAction } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

// Re-export client-side function for backward compatibility
export { hasPerm } from "@/lib/perms-client";

// For API routes (server)
export async function requireApiPerm(moduleKey: string, action: PermAction) {
  const { hasPerm } = await import("@/lib/perms-client");
  const session = await getServerSession(authOptions);
  const perms = (session?.user as any)?.perms as PermissionMap | undefined;
  if (!session || !hasPerm(perms, moduleKey, action)) {
    return { ok: false as const, res: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }) };
  }
  return { ok: true as const, session, perms };
}
