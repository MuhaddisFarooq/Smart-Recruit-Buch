"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/dashboard/TopNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // If not authenticated, redirect to login
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // If user is a candidate, redirect to candidate dashboard
    const userRole = ((session?.user as any)?.role || "").toLowerCase();
    if (userRole === "candidate") {
      router.push("/candidate/jobs");
      return;
    }
  }, [session, status, router]);

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#238740]"></div>
      </div>
    );
  }

  // If candidate, show nothing while redirecting
  const userRole = ((session?.user as any)?.role || "").toLowerCase();
  if (userRole === "candidate") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNav />
      <main className="pt-16 md:pt-20 px-4 md:px-6 lg:pl-14 lg:pr-6">
        <div className="max-w-[1200px] mx-auto py-4 md:py-6 px-0 md:px-2">
          {children}
        </div>
      </main>
    </div>
  );
}
