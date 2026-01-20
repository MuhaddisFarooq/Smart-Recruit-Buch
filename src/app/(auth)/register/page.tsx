"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const form = new FormData(e.currentTarget);
        const name = String(form.get("name") || "").trim();
        const email = String(form.get("email") || "").trim();
        const cnic = String(form.get("cnic") || "").trim();
        const phone = String(form.get("phone") || "").trim();

        try {
            const res = await fetch("/api/auth/register/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, cnic, phone }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Verification code sent to your email.");
                // Use hard navigation to ensure we load the new page fresh
                window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`;
            } else {
                toast.error(data.error || "Registration failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during registration");
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
                <h1 className="text-2xl font-bold">Create Account</h1>
                <p className="text-muted-foreground text-sm">Sign up to apply for jobs</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
                <div className="space-y-1">
                    <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                    <Input id="name" name="name" type="text" placeholder="John Doe" required />
                </div>
                <div className="space-y-1">
                    <label htmlFor="cnic" className="text-sm font-medium">CNIC (13 digits without dashes)</label>
                    <Input
                        id="cnic"
                        name="cnic"
                        type="text"
                        placeholder="1234512345671"
                        required
                        minLength={13}
                        maxLength={13}
                        pattern="\d{13}"
                        title="Please enter exactly 13 digits"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="phone" className="text-sm font-medium">Contact No</label>
                    <Input id="phone" name="phone" type="tel" placeholder="03001234567" required />
                </div>
                <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input id="email" name="email" type="email" placeholder="example@buchhospital.com" required />
                </div>

                <Button type="submit" className="bg-[#b9d36c] hover:bg-[#a8c65f] text-white w-full shadow-md" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Next"}
                </Button>

                <div className="text-center text-sm mt-4">
                    Already have an account?{" "}
                    <Link href="/" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                </div>
            </form>
        </div>
    );
}
