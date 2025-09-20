"use client"
import React, { useEffect } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { navMain } from "@/lib/NavMenu"
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  useEffect(() => {
    // console.log('pathname', pathname)
  }, [pathname])

  // find the current main section
  const parentItem = navMain.find((item) =>
    item.items?.some((i) => i.url === pathname)
  )

  // find the subpage (child) under that section
  const childItem = parentItem?.items?.find((i) => i.url === pathname)

  return (
    <header className=" flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {pathname === "/dashboard" ? (
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>

                {parentItem && !childItem && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbPage>{parentItem.title ?? "Page"}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}

                {parentItem && childItem && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink>{parentItem.title ?? "Page"}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href={parentItem.url ?? ""}>
                        {childItem.title ?? "Page"}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}





// "use client"
// import React, { useEffect } from 'react'
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb"
// import { Separator } from "@/components/ui/separator"
// import { SidebarTrigger } from "@/components/ui/sidebar"
// import { navMain } from "@/lib/NavMenu"
// import { usePathname } from 'next/navigation'
// import { Bell } from "lucide-react"
// import ThemeToggle from "@/components/ui/ThemeToggle"

// export default function Header() {
//   const pathname = usePathname()

//   useEffect(() => {
//     console.log('pathname', pathname)
//   }, [pathname])

//   // find the current main section
//   const parentItem = navMain.find((item) =>
//     item.items?.some((i) => i.url === pathname)
//   )

//   // find the subpage (child) under that section
//   const childItem = parentItem?.items?.find((i) => i.url === pathname)

//   return (
//     <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
//       <div className="flex items-center gap-2 px-4">
//         <SidebarTrigger className="-ml-1" />
//         <Separator
//           orientation="vertical"
//           className="mr-2 data-[orientation=vertical]:h-4"
//         />
//         <Breadcrumb>
//           <BreadcrumbList>
//             {pathname === "/dashboard" ? (
//               <BreadcrumbItem className="hidden md:block">
//                 <BreadcrumbPage>Dashboard</BreadcrumbPage>
//               </BreadcrumbItem>
//             ) : (
//               <>
//                 <BreadcrumbItem className="hidden md:block">
//                   <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
//                 </BreadcrumbItem>

//                 {parentItem && !childItem && (
//                   <>
//                     <BreadcrumbSeparator className="hidden md:block" />
//                     <BreadcrumbItem className="hidden md:block">
//                       <BreadcrumbPage>{parentItem.title ?? "Page"}</BreadcrumbPage>
//                     </BreadcrumbItem>
//                   </>
//                 )}

//                 {parentItem && childItem && (
//                   <>
//                     <BreadcrumbSeparator className="hidden md:block" />
//                     <BreadcrumbItem className="hidden md:block">
//                       <BreadcrumbLink>{parentItem.title ?? "Page"}</BreadcrumbLink>
//                     </BreadcrumbItem>
//                     <BreadcrumbSeparator className="hidden md:block" />
//                     <BreadcrumbItem className="hidden md:block">
//                       <BreadcrumbLink href={parentItem.url ?? ""}>
//                         {childItem.title ?? "Page"}
//                       </BreadcrumbLink>
//                     </BreadcrumbItem>
//                   </>
//                 )}
//               </>
//             )}
//           </BreadcrumbList>
//         </Breadcrumb>
//       </div>
//       <div className="ml-auto flex items-center gap-4 px-4">
//         <button
//           type="button"
//           className="p-2 rounded-full hover:bg-muted transition-colors"
//           aria-label="Notifications"
//         >
//           <Bell className="w-5 h-5" />
//         </button>
//         <ThemeToggle />
//       </div>
//     </header>
//   )
// }
