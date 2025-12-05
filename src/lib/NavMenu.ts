// src/lib/NavMenu.ts
import { Gauge, LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

// Keep exports the sidebar expects, but only include Dashboard
export const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Gauge,
    isActive: true,
  },
];

// If your sidebar calls getActiveNav(), just return the single-item menu
export const getActiveNav = () => navMain;
