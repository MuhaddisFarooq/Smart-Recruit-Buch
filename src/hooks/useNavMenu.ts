"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Briefcase,
  Users,
  AudioWaveform,
} from "lucide-react";

import type { PermissionMap } from "@/lib/perms-client";
import { hasPerm } from "@/lib/perms-client";

export type NavItem = {
  title: string;
  url: string;
  icon?: any;
  isActive?: boolean;
  items?: NavItem[];
};

/** Full menu; filtered per user below */
export const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: AudioWaveform,
    isActive: true,
    items: [],
  },
  {
    title: "Jobs",
    url: "/jobs",
    icon: Briefcase,
    isActive: true,
    items: [
      { title: "View Jobs", url: "/jobs", isActive: true },
      { title: "Add Job", url: "/jobs/add", isActive: true },
    ],
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    isActive: true,
    items: [
      { title: "View Users", url: "/users", isActive: true },
      { title: "Add User", url: "/users/add", isActive: true },
    ],
  },
];

/** Title → permission key mapping */
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
  Blogs: "blogs",
  Pathology: "pathology",
  Users: "users",
  Jobs: "jobs",
};

export const useNavMenu = () => {
  const { data } = useSession();
  const perms = (data?.user as any)?.perms as PermissionMap | undefined;
  const userRole: string = (data?.user as any)?.role || "user";

  return useMemo<NavItem[]>(() => {
    if (!perms) return [];

    return navMain
      .map<NavItem | null>((section) => {
        const key = moduleKeyByTitle[section.title];
        if (!key) return section;

        const canSeeModule =
          hasPerm(perms, key, "view") ||
          hasPerm(perms, key, "new") ||
          hasPerm(perms, key, "edit") ||
          hasPerm(perms, key, "delete") ||
          hasPerm(perms, key, "export");

        const email = (data?.user?.email || "").toLowerCase();
        const isHR = (userRole || "").trim().toLowerCase() === "hr" || email === "hr@example.com";
        const isAdmin = userRole === "admin" || userRole === "superadmin" || email.includes("admin");
        const isCandidate = userRole === "candidate";

        // Top-level permission check
        if (key === "jobs" && (isHR || isCandidate)) {
          // HR and Candidate sees jobs
        } else if (key === "users" && (isAdmin || isHR)) {
          // Admin sees users
        } else if (!canSeeModule) {
          return null;
        }

        const items = (section.items ?? []).filter((it) => {
          const ttl = (it.title || "").toLowerCase();

          // Sub-item specific permission checks
          if (key === "jobs" && isHR) return true;
          if (key === "jobs" && isCandidate) {
            // Candidate can only view jobs
            return ttl.includes("view");
          }
          if (key === "users" && (isAdmin || isHR)) return true;

          if (ttl.startsWith("view")) return hasPerm(perms, key, "view");
          if (ttl.startsWith("add") || ttl.includes("import")) return hasPerm(perms, key, "new");

          return true;
        });

        if (!items.length) return null;
        return { ...section, items };
      })
      .filter((x): x is NavItem => !!x);
  }, [perms, data]); // Added data dependency
};
