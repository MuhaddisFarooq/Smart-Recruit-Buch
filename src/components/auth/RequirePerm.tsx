// src/components/auth/RequirePerm.tsx
"use client";
import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import { hasPerm, type PermissionMap, type PermAction } from "@/lib/perms-client";
import { useRouter } from "next/navigation";

export default function RequirePerm({
  moduleKey,
  action,
  children,
}: {
  moduleKey: string;
  action: PermAction;
  children: ReactNode;
}) {
  const { data, status } = useSession();
  const router = useRouter();
  const perms = (data?.user as any)?.perms as PermissionMap | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
    if (status === "authenticated" && !hasPerm(perms, moduleKey, action)) router.replace("/403");
  }, [status, perms, router, moduleKey, action]);

  if (status !== "authenticated") return null;
  if (!hasPerm(perms, moduleKey, action)) return null;
  return <>{children}</>;
}
