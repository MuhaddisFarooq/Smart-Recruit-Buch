// src/lib/perms-client.ts
// Client-side permission utilities (no server imports)

export type PermAction = "view" | "new" | "edit" | "delete" | "export" | "import";

export interface PermissionMap {
  [moduleKey: string]: {
    [action in PermAction]?: boolean;
  };
}

export function hasPerm(perms: PermissionMap | undefined, moduleKey: string, action: PermAction): boolean {
  if (!perms) return false;
  const global = perms["*"]?.[action] === true;
  const specific = perms[moduleKey]?.[action] === true;
  return global || specific;
}