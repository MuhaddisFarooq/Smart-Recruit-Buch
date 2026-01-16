"use client";
import React, { useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoadingStore } from "@/store/useLoadingStore";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";


const mapNextAuthError = (code?: string) => {
  switch (code) {
    case "CredentialsSignin":
      return "Invalid email or password.";
    case "AccessDenied":
      return "Access restricted. Only the SuperAdmin can sign in.";
    case "Configuration":
      return "Auth configuration error. Please contact the administrator.";
    case "OAuthAccountNotLinked":
      return "This email is already linked to a different login method.";
    default:
      return "Sign in failed. Please try again.";
  }
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showLoader, hideLoader } = useLoadingStore();

  // If middleware bounced the user back:
  useEffect(() => {
    if (searchParams.get("unauthorized") === "true") {
      toast.error("You are not authorized to view that page.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    showLoader();

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "").trim();

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.ok) {
        toast.success("Login successful!");

        // Fetch session to get user role
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const userRole = (session?.user?.role || "").toLowerCase();

        // Redirect based on role
        if (userRole === "candidate") {
          router.push("/candidate/jobs");
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error(mapNextAuthError(res?.error ?? undefined));
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" name="email" type="email" placeholder="example@buchhospital.com" required />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Input id="password" name="password" type="password" required />
        </div>

        <Button type="submit" className="bg-primary w-full shadow-md">Sign in</Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-primary text-primary hover:bg-primary/10"
          onClick={() => router.push('/candidate/jobs')}
        >
          Explore as Guest
        </Button>
      </form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => window.location.href = '/register'}
          className="text-primary hover:underline font-medium bg-transparent border-none cursor-pointer p-0"
        >
          Register
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="w-full lg:w-[30%] flex flex-col justify-center p-8">
      <div className="text-center">
        <img src="/buch-logo.png" alt="Company Logo" className="w-40 mx-auto pointer-events-none" />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
