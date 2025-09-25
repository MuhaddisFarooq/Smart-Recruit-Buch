// src/app/(dashboard)/_nav.tsx  (or wherever your nav lives)
"use client";

import { useMemo } from "react";
import { Gauge, Settings2, Users, Briefcase, Trophy, Building2,ClipboardList,Image as ImageIcon } from "lucide-react";

type NavItem = { title: string; url: string; icon?: any; isActive?: boolean; items?: NavItem[] };

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

  // ✅ New: Insurance
  {
    title: "Insurance",
    url: "#",
    icon: Building2,
    isActive: true,
    items: [
      { title: "View Insurance Company", url: "/insurance/company/view", isActive: true },
      { title: "Add Insurance Company", url: "/insurance/company/add", isActive: true },
      { title: "View Insurance Corporate", url: "/insurance/corporate/view", isActive: true },
      { title: "Add Insurance Corporate", url: "/insurance/corporate/add", isActive: true },
    ],
  },


// inside navMain array:
{
  title: "Executive Health Checkups",
  url: "#",
  icon: ClipboardList,
  isActive: true,
  items: [
    { title: "View", url: "/executive-health-checkups/view", isActive: true },
    { title: "Add Executive Health Checkup", url: "/executive-health-checkups/add", isActive: true },
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

];



export const useNavMenu = () => useMemo(() => navMain, []);
