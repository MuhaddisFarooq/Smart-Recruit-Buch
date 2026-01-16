"use client";

import { useRouter } from "next/navigation";
import { UserPlus, LogIn } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthRequiredDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    message?: string;
    returnUrl?: string;
}

export default function AuthRequiredDialog({ open, onOpenChange, message, returnUrl }: AuthRequiredDialogProps) {
    const router = useRouter();

    const handleRedirect = (type: "login" | "register") => {
        const target = returnUrl || (typeof window !== 'undefined' ? window.location.pathname : '/candidate/jobs');
        const encodedReturn = encodeURIComponent(target);
        const baseUrl = type === "register" ? "/register" : "/";
        router.push(`${baseUrl}?callbackUrl=${encodedReturn}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">Join Our Community</DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                        {message || "Please sign in or create an account to continue."}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                    <Button
                        className="bg-[#b9d36c] hover:bg-[#a3bd5b] text-neutral-900 font-bold h-12 text-lg"
                        onClick={() => handleRedirect('register')}
                    >
                        <UserPlus className="mr-2 h-5 w-5" />
                        Create an Account
                    </Button>
                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-neutral-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-neutral-500">Already have an account?</span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="h-12 text-lg border-neutral-300 hover:bg-neutral-50"
                        onClick={() => handleRedirect('login')}
                    >
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign In
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
