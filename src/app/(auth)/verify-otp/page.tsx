"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

function VerifyOtpContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);

    useEffect(() => {
        if (!email) {
            router.push("/register");
        }
    }, [email, router]);

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleResend = async () => {
        // Simple re-use of initiate endpoint which handles resending for unverified users
        // But initiate requires Name/CNIC etc. which we don't have here easily unless we store them.
        // Actually the initiate endpoint we wrote re-generates OTP if user exists but unverified.
        // But we need to pass Name/CNIC to it. 
        // Ideally we should have a separate 'resend-otp' API that takes just email.
        // For now, let's assume the user has the code or goes back.
        // Implementing proper Resend requires a new API or modifying initiate to allow just email for resend.
        // Let's skip Resend button logic complexity for this iteration to keep it simple, or mock it.
        toast.info("Please check your email again or go back to register to send a new code.");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const form = new FormData(e.currentTarget);
        const otp = String(form.get("otp") || "").trim();
        const password = String(form.get("password") || "").trim();
        const confirmPassword = String(form.get("confirmPassword") || "").trim();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/register/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, password }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Account created successfully!");
                router.push("/"); // Go to login
            } else {
                toast.error(data.error || "Verification failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during verification");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full lg:w-[30%] flex flex-col justify-center p-8">
            <div className="text-center mb-8">
                <img src="/buch-logo.png" alt="Company Logo" className="w-40 mx-auto pointer-events-none" />
            </div>
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Verify Email</h1>
                <p className="text-muted-foreground text-sm">Enter the code sent to {email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
                <div className="space-y-1">
                    <label htmlFor="otp" className="text-sm font-medium">Verification Code (OTP)</label>
                    <Input
                        id="otp"
                        name="otp"
                        type="text"
                        placeholder="123456"
                        required
                        className="text-center tracking-widest text-lg"
                        maxLength={6}
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="password" className="text-sm font-medium">New Password</label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <Button type="submit" className="bg-[#b9d36c] hover:bg-[#a8c65f] text-white w-full shadow-md" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Complete Registration"}
                </Button>

                <div className="text-center text-sm mt-4">
                    <Link href="/register" className="text-primary hover:underline font-medium">
                        Change Email / Back
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyOtpContent />
        </Suspense>
    );
}
