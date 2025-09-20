"use client"
import { useLoadingStore } from "@/store/useLoadingStore"
import { useEffect } from "react"

export default function Loader() {
  const isLoading = useLoadingStore((state) => state.isLoading)

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}
