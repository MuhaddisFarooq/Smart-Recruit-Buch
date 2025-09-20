"use client"
import React from 'react'
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLoadingStore } from "@/store/useLoadingStore"
import { toast } from "sonner" // ✅ Import toast
import { useRouter } from "next/navigation"
import Link from 'next/link'

export default function Page() {
  const router = useRouter()
  const { showLoader, hideLoader } = useLoadingStore()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    showLoader()

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const res = await signIn("credentials", {
        redirect: false,
        username: email,
        password: password,
      })

      if (res?.ok) {
        toast.success("Login successful!")
        router.push("/dashboard")
      } else {
        toast.error(res?.error || "Invalid credentials")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      hideLoader()
    }
  }

  return (
    <div className="w-full lg:w-[30%] flex flex-col justify-center p-8">
      <div className="text-center">
        <img 
          src="/BINC_logo.png" 
          alt="Company Logo" 
          className="w-40 mx-auto pointer-events-none"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md mx-auto">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" name="email" type="email" placeholder="example@binc.pk" required />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Input id="password" name="password" type="password" required />
        </div>
        <div className="flex justify-end">
         <Link className='hover:text-shadow-gray-800' href="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="submit" className="bg-primary w-full shadow-md">Sign in</Button>
      </form>
    </div>
  )
}
