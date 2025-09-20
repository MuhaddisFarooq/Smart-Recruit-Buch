"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

// import {navMain,getActiveNav} from "@/lib/NavMenu"

import { NavMain } from "@/components/ui/nav-main"
import { NavProjects } from "@/components/ui/nav-projects"
import { NavUser } from "@/components/ui/nav-user"
import { TeamSwitcher } from "@/components/ui/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import { getImageFileUrl } from "@/lib/utils"
import { useNavMenu } from "@/hooks/useNavMenu"



interface userData {
  name?: string | null
  email?: string | null
  avatar?: string | null
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
  const { data: session } = useSession()
  const user:any = session?.user
  const userData:any = {
    name: user?.name,
    email: user?.email,
    avatar: getImageFileUrl(user?.avatar),
  }
  const navMenuMain = useNavMenu()
  return (
    <Sidebar collapsible="icon" {...props} className="">
      <SidebarHeader>
        <div className="w-full flex justify-center items-center pt-5">
          { state == "collapsed" && (
            <img
              src="/buch-logo.png"
              alt="Logo"
              className="w-20 invert brightness-0"
            />
          )}
          { state == "expanded" && (
            <img
              src="/BINC_logo.png"
              alt="Logo"
              className="w-32 invert brightness-0"
            />
          )}
      
        </div>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMenuMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
