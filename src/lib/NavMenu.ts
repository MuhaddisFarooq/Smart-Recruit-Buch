// src/lib/NavMenu.ts
import { Gauge } from "lucide-react";

// Keep exports the sidebar expects, but only include Dashboard
export const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Gauge,
    isActive: true,
  },
];

// If your sidebar calls getActiveNav(), just return the single-item menu
export const getActiveNav = () => navMain;
