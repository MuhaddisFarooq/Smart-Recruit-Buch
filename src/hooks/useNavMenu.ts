"use client";

import { useMemo } from "react";
import {
  Gauge,
  Settings2,
  Users,
  Briefcase,
  Trophy,            // 👈 add
} from "lucide-react";

type NavItem = {
  title: string;
  url: string;
  icon?: any;
  isActive?: boolean;
  items?: NavItem[];
};

export const navMain: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Gauge, isActive: true },

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

  // ✅ NEW
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
];

export const useNavMenu = () => useMemo(() => navMain, []);