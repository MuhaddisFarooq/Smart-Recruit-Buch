"use client";

import { useSession } from "next-auth/react";
import { hasPerm, type PermissionMap } from "@/lib/perms-client";
import type { NavItem } from "@/hooks/useNavMenu";
import { navMain } from "@/hooks/useNavMenu";

/**
 * Map the top-level menu titles to module keys used by your permission system.
 * Update keys if you rename modules in the DB.
 */
const moduleKeyByTitle: Record<string, string> = {
  Consultants: "consultants",
  Careers: "careers",
  "Management Team": "management_team",
  Achievements: "achievements",
  Insurance: "insurance_company",
  Corporate: "insurance_corporate",
  EHC: "ehc",
  PopUp: "popup",
  Slider: "slider",
  Testimonials: "testimonials",
  "Clinical Study": "clinical_study",
  Publications: "publications",
  "HR Training": "hr_training",
  "Fertility Treatment": "fertility_treatment",
  Users: "users",
};

/**
 * Decide which child items show based on the item's title.
 * - "view"    → needs `view`
 * - "add"     → needs `new`
 * - "import"  → treat as `new` (since it creates data)
 * - everything else defaults to visible (or customize here)
 */
function itemVisibleByTitle(title: string, perms: PermissionMap | undefined, moduleKey: string) {
  const ttl = title.toLowerCase();
  if (ttl.includes("view")) return hasPerm(perms, moduleKey, "view");
  if (ttl.includes("add")) return hasPerm(perms, moduleKey, "new");
  if (ttl.includes("import")) return hasPerm(perms, moduleKey, "new");
  // neutral items → show (or lock down further if you add more rules)
  return true;
}

/**
 * Returns a permission-filtered navigation tree.
 * - If user has neither `view` nor `new` for a module, the whole section is hidden.
 * - Within a module, each item is shown only if the user has the required permission.
 */
export function useFilteredNav(): NavItem[] {
  const { data } = useSession();
  const perms = (data?.user as any)?.perms as PermissionMap | undefined;

  return navMain
    .map<NavItem | null>((section) => {
      const moduleKey = moduleKeyByTitle[section.title] || "";
      // If section isn't governed by permissions, return as-is
      if (!moduleKey) return section;

      const canView = hasPerm(perms, moduleKey, "view");
      const canNew = hasPerm(perms, moduleKey, "new");

      // If user has neither view nor new, hide the whole module
      if (!canView && !canNew) return null;

      // Filter items by per-item visibility
      const filteredItems: NavItem[] = (section.items ?? []).filter((item: NavItem) =>
        itemVisibleByTitle(item.title || "", perms, moduleKey)
      );

      return { ...section, items: filteredItems };
    })
    .filter((x): x is NavItem => !!x);
}
