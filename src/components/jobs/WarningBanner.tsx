"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

type WarningBannerProps = {
    message: string;
    linkText?: string;
    linkHref?: string;
};

export default function WarningBanner({ message, linkText, linkHref }: WarningBannerProps) {
    return (
        <div className="bg-[#FFF8E7] border border-[#F0C36D] rounded px-4 py-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#D4A017]" />
                <span className="text-sm text-[#333]">{message}</span>
            </div>
            {linkText && linkHref && (
                <Link href={linkHref} className="text-sm text-[#2563EB] hover:underline font-medium">
                    {linkText}
                </Link>
            )}
        </div>
    );
}
