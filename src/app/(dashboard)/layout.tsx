import { AppSidebar } from "@/components/ui/app-sidebar"
import Header from "@/components/common/Header"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import PageLoader from "@/components/common/PageLoader"
import PageTransitionLoader from "@/components/common/pageTransitionLoader"
import { defaultRoles } from "@/lib/constants"


export default function layout({children}: {children: React.ReactNode}) {
  return (
    
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full flex-1 overflow-hidden">
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 relative">
          <PageTransitionLoader />
          <PageLoader />
            <Header />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
