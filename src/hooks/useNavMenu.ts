// hooks/useNavMenu.ts
"use client";

import { useMemo } from "react";
import { Gauge } from "lucide-react";

type NavItem = {
  title: string;
  url: string;
  icon?: any;
  isActive?: boolean;
  items?: NavItem[];
};

// Single-item menu: Dashboard only
export const navMain: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Gauge, isActive: true },
];

// Hook returns only the dashboard item, always
export const useNavMenu = (): NavItem[] => {
  return useMemo(() => navMain, []);
};
