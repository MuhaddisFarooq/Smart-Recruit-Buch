// components/PageTransitionLoader.tsx
"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { usePageLoaderStore } from "@/store/usePageLoaderStore"

export default function PageTransitionLoader() {
  const pathname = usePathname()
  const showLoader = usePageLoaderStore((state) => state.showLoader)
  const hideLoader = usePageLoaderStore((state) => state.hideLoader)

  useEffect(() => {
    // Listen for link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a') as HTMLAnchorElement
      
      // Check if it's an internal link
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        const href = new URL(link.href).pathname
        // Only show loader if navigating to different page
        if (href !== pathname) {
          showLoader()
        }
      }
    }

    // Add event listener to document
    document.addEventListener('click', handleLinkClick)

    return () => {
      document.removeEventListener('click', handleLinkClick)
    }
  }, [pathname, showLoader])

  useEffect(() => {
    // Hide loader when pathname changes (navigation complete)
    const timeout = setTimeout(() => {
      hideLoader()
    }, 500)

    return () => clearTimeout(timeout)
  }, [pathname, hideLoader])

  return null
}




// components/PageTransitionLoader.tsx
// "use client"

// import { useEffect } from "react"
// import { usePathname } from "next/navigation"
// import { usePageLoaderStore } from "@/store/usePageLoaderStore"

// export default function PageTransitionLoader() {
//   const pathname = usePathname()
//   const showLoader = usePageLoaderStore((state) => state.showLoader)
//   const hideLoader = usePageLoaderStore((state) => state.hideLoader)

//   useEffect(() => {
//     // Show loader immediately on route change
//     showLoader()

//     // Hide loader after short timeout or transition
//     const timeout = setTimeout(() => {
//       hideLoader()
//     }, 500) // you can tweak this duration

//     return () => clearTimeout(timeout)
//   }, [pathname])

//   return null
// }
