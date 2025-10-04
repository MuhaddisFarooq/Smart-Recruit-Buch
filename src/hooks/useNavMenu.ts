// src/app/(dashboard)/_nav.tsx  (or wherever your nav lives)
"use client";

import { useMemo } from "react";
import { Gauge, Settings2, Users, Briefcase, Trophy, Building2,ClipboardList,Image as ImageIcon,Images,MessageSquareQuote,FlaskConical,BookOpen } from "lucide-react";

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


 {
    title: "Slider",
    url: "#",
    icon: Images,
    isActive: true,
    items: [
      { title: "View",       url: "/slider/view", isActive: true },
      { title: "Add Slider", url: "/slider/add",  isActive: true },
    ],
  },

  {
  title: "Testimonials",
  url: "#",
  icon: MessageSquareQuote,
  isActive: true,
  items: [
    { title: "View",            url: "/testimonials/view", isActive: true },
    { title: "Add Testimonial", url: "/testimonials/add",  isActive: true },
  ],
},

{
  title: "Clinical Study",
  url: "#",
  icon: FlaskConical,
  isActive: true,
  items: [
    { title: "View",           url: "/clinical-study/view", isActive: true },
    { title: "Add Clinical Study", url: "/clinical-study/add",  isActive: true },
  ],
},


{
  title: "Publications",
  url: "#",
  icon: BookOpen,
  isActive: true,
  items: [
    { title: "View",            url: "/publications/view", isActive: true },
    { title: "Add Publication", url: "/publications/add",  isActive: true },
  ],
},

{
  title: "HR Training",
  url: "#",
  icon: ClipboardList,       
  isActive: true,
  items: [
    { title: "View",           url: "/hr-training/view", isActive: true },
    { title: "Add HR Training",url: "/hr-training/add",  isActive: true },
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


];







export const useNavMenu = () => useMemo(() => navMain, []);
