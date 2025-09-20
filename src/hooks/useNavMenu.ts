"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Settings2,
  Clock,
  Gauge,
  School,
  SquareChartGantt,
  GraduationCap,
  ChartBarBig,
  LibraryBig,
  File,
  Megaphone,
  ClipboardList,
  Users,
  CalendarDays,
  CoinsIcon,
  Phone,
} from "lucide-react";
import { superAdmin } from "@/lib/constants";

export const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Gauge,
    isActive: true,
  },
  {
    title: "Manage Access",
    url: "#",
    icon: Settings2,
    isActive: false,
    items: [
      { title: "Manage Roles", url: "/manage-roles", isActive: false },
      { title: "Manage Pages", url: "/manage-pages", isActive: false },
      { title: "Manage Actions", url: "/manage-actions", isActive: false },
      { title: "Manage Permissions", url: "/manage-permissions", isActive: false },
      { title: "Assign Permissions", url: "/assign-permissions", isActive: false },
    ],
  },
  {
    title: "Manage Admissions",
    url: "#",
    icon: GraduationCap,
    isActive: false,
    items: [
      { title: "Applications", url: "/applications", isActive: false },
      { title: "Confirm Admission", url: "/confirm-admission", isActive: false },
    ],
  },
  {
    title: "Fee Management",
    url: "#",
    icon: CoinsIcon,
    isActive: false,
    items: [
      { title: "Fee Management", url: "/fee-management", isActive: false },
      { title: "Discount Requests", url: "/discount-requests", isActive: false },
      { title: "Installment Requests", url: "/installment-requests", isActive: false },
      { title: "Scholarship Requests", url: "/scholarship-requests", isActive: false },
    ],
  },
  {
    title: "Staff Management",
    url: "#",
    icon: Users,
    isActive: false,
    items: [
      { title: "Manage Departments", url: "/manage-departments", isActive: false },
      { title: "Manage Designations", url: "/manage-designations", isActive: false },
      { title: "Manage Users", url: "/manage-users", isActive: false },
    ],
  },
  {
    title: "Class Management",
    url: "#",
    icon: School,
    isActive: false,
    items: [
      { title: "Manage Students", url: "/manage-students", isActive: false },
      { title: "Manage Sessions", url: "/manage-sessions", isActive: false },
      { title: "Manage Subjects", url: "/manage-subjects", isActive: false },
      { title: "Manage Sections", url: "/manage-sections", isActive: false },
      // { title: "Assign Subjects", url: "/assign-subjects", isActive: false },
      { title: "Assign Class", url: "/bulk-assign-class", isActive: false },
      { title: "Promote Students", url: "/promote-students", isActive: false },
    ],
  },
  {
    title: "Leave Management",
    url: "#",
    icon: Clock,
    isActive: false,
    items: [
      { title: "Manage Leaves", url: "/manage-leaves", isActive: false },
      { title: "Apply Leave", url: "/apply-leave", isActive: false },
      { title: "Applied Leaves", url: "/applied-leaves", isActive: false },
    ],
  },
  {
    title: "Timetable",
    url: "/timetable",
    icon: CalendarDays,
    isActive: false,
  },
  { title: "Manage Programs", url: "/manage-programs", icon: BookOpen, isActive: false },
  { title: "Announcements", url: "/announcements", icon: Megaphone, isActive: false },
  { title: "Assignments", url: "/assignments", icon: File, isActive: false },
  { title: "Quizzes", url: "/quizzes", icon: ClipboardList, isActive: false },
  { title: "Mark Quizzes", url: "/mark-quiz", icon: SquareChartGantt, isActive: false },
  { title: "Mark Assignments", url: "/mark-assignments", icon: ChartBarBig, isActive: false },
  { title: "Study Materials", url: "/study-materials", icon: LibraryBig, isActive: false },
  { title: "Manage Attendance", url: "/manage-attendence", icon: Users, isActive: false },
  { title: "Contacts", url: "/contacts", icon: Phone, isActive: false },
];

// ✅ Custom hook with useMemo
export const useNavMenu = () => {
  const { data: session }:any = useSession();
  const pages: any[] = session?.user?.pages || [];
  const role = session?.user?.role || "";

  return useMemo(() => {
    const isPageAllowed = (url: string) => {
      return url === "/dashboard" ? true : pages.some((page: any) => page.path === url);
    };

    const processNavItems = (items: any[]): any[] => {
      return items.map((item) => {
        const subItems = item.items ? processNavItems(item.items) : [];

        const isActive =
          role === superAdmin
            ? true
            : isPageAllowed(item.url) || subItems.some((sub) => sub.isActive);

        return {
          ...item,
          isActive,
          ...(subItems.length > 0 ? { items: subItems } : {}),
        };
      });
    };

    return processNavItems(navMain);
  }, [pages, role]); // ✅ Only recalculates if pages or role changes
};
