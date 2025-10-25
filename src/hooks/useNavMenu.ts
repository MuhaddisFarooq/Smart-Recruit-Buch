"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Settings2,
  Users,
  Briefcase,
  Trophy,
  Building2,
  ClipboardList,
  Image as ImageIcon,
  Images,
  MessageSquareQuote,
  FlaskConical,
  BookOpen,
  Users as UsersIcon,
  Newspaper, // <-- for Blogs
  TestTube, // <-- for Pathology
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
    title: "Consultants",
    url: "#",
    icon: Settings2,
    isActive: true,
    items: [
      { title: "View", url: "/consultants", isActive: true },
      { title: "Add New", url: "/consultants/add-new", isActive: true },
      { title: "Import From Excel", url: "/consultants/import", isActive: true },
      { title: "View Consultant Category", url: "/consultants/categories", isActive: true },
      { title: "Add Consultant Category", url: "/consultants/categories/add", isActive: true },
    ],
  },
  {
    title: "Careers",
    url: "#",
    icon: Briefcase,
    isActive: true,
    items: [
      { title: "View", url: "/careers/view", isActive: true },
      { title: "Add New", url: "/careers/add", isActive: true },
    ],
  },
  {
    title: "Management Team",
    url: "#",
    icon: Users,
    isActive: true,
    items: [
      { title: "View", url: "/management-team/view", isActive: true },
      { title: "Add Team", url: "/management-team/add", isActive: true },
    ],
  },
  {
    title: "Achievements",
    url: "#",
    icon: Trophy,
    isActive: true,
    items: [
      { title: "View", url: "/achievements/view", isActive: true },
      { title: "Add Achievement", url: "/achievements/add", isActive: true },
    ],
  },
  {
    title: "Insurance",
    url: "#",
    icon: Building2,
    isActive: true,
    items: [
      { title: "View Insurance Company", url: "/insurance/company/view", isActive: true },
      { title: "Add Insurance Company", url: "/insurance/company/add", isActive: true },
    ],
  },
  {
    title: "Corporate",
    url: "#",
    icon: Building2,
    isActive: true,
    items: [
      { title: "View Insurance Corporate", url: "/insurance/corporate/view", isActive: true },
      { title: "Add Insurance Corporate", url: "/insurance/corporate/add", isActive: true },
    ],
  },
  {
    title: "EHC",
    url: "#",
    icon: ClipboardList,
    isActive: true,
    items: [
      { title: "View", url: "/executive-health-checkups/view", isActive: true },
      { title: "Add EHC", url: "/executive-health-checkups/add", isActive: true },
    ],
  },
  {
    title: "PopUp",
    url: "#",
    icon: ImageIcon,
    isActive: true,
    items: [
      { title: "View", url: "/popup/view", isActive: true },
      { title: "Add PopUp", url: "/popup/add", isActive: true },
    ],
  },
  {
    title: "Slider",
    url: "#",
    icon: Images,
    isActive: true,
    items: [
      { title: "View", url: "/slider/view", isActive: true },
      { title: "Add Slider", url: "/slider/add", isActive: true },
    ],
  },
  {
    title: "Testimonials",
    url: "#",
    icon: MessageSquareQuote,
    isActive: true,
    items: [
      { title: "View", url: "/testimonials/view", isActive: true },
      { title: "Add Testimonial", url: "/testimonials/add", isActive: true },
    ],
  },
  {
    title: "Clinical Study",
    url: "#",
    icon: FlaskConical,
    isActive: true,
    items: [
      { title: "View", url: "/clinical-study/view", isActive: true },
      { title: "Add Clinical Study", url: "/clinical-study/add", isActive: true },
    ],
  },
  {
    title: "Publications",
    url: "#",
    icon: BookOpen,
    isActive: true,
    items: [
      { title: "View", url: "/publications/view", isActive: true },
      { title: "Add Publication", url: "/publications/add", isActive: true },
    ],
  },
  {
    title: "HR Training",
    url: "#",
    icon: ClipboardList,
    isActive: true,
    items: [
      { title: "View", url: "/hr-training/view", isActive: true },
      { title: "Add HR Training", url: "/hr-training/add", isActive: true },
    ],
  },
  {
    title: "Fertility Treatment",
    url: "#",
    icon: Images,
    isActive: true,
    items: [
      { title: "View", url: "/fertility-treatments/view", isActive: true },
      { title: "Add Fertility Treatment", url: "/fertility-treatments/add", isActive: true },
    ],
  },

  /* ---------------- Blogs (NEW) ---------------- */
  {
    title: "Blogs",
    url: "#",
    icon: Newspaper,
    isActive: true,
    items: [
      { title: "View", url: "/blogs/view", isActive: true },
      { title: "Add Blog Post", url: "/blogs/add", isActive: true },
    ],
  },

  /* ---------------- Pathology (NEW) ---------------- */
  {
    title: "Pathology",
    url: "#",
    icon: TestTube,
    isActive: true,
    items: [
      { title: "View", url: "/pathology/view", isActive: true },
      { title: "Add Test", url: "/pathology/add-new", isActive: true },
    ],
  },

  {
    title: "Users",
    url: "#",
    icon: UsersIcon,
    isActive: true,
    items: [
      { title: "Add Users",        url: "/users/add",         isActive: true },
      { title: "Add User Group",   url: "/users/groups/add",  isActive: true },
      { title: "View User Groups", url: "/users/groups/view", isActive: true },
      { title: "View",             url: "/users/view",        isActive: true },
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
  "Fertility Treatment": "fertility_treatments",
  Blogs: "blogs",
  Pathology: "pathology", // <-- NEW permission module
  Users: "users",
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

        if (!canSeeModule) return null;

        const items = (section.items ?? []).filter((it) => {
          const ttl = (it.title || "").toLowerCase();

          if (ttl.includes("user group") || it.url?.includes("/users/groups/")) {
            return userRole === "superadmin";
          }
          if (ttl.startsWith("view")) return hasPerm(perms, key, "view");
          if (ttl.startsWith("add") || ttl.includes("import")) return hasPerm(perms, key, "new");
          return true;
        });

        if (!items.length) return null;
        return { ...section, items };
      })
      .filter((x): x is NavItem => !!x);
  }, [perms, userRole]);
};
