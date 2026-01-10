"use client";

import { Search, X } from "lucide-react";

type JobsSearchBarProps = {
    value: string;
    onChange: (value: string) => void;
};

export default function JobsSearchBar({ value, onChange }: JobsSearchBarProps) {
    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search by job title, location, recruiter..."
                className="w-full h-11 px-4 pr-12 text-base border border-[#E6E6E6] rounded-md bg-white focus:outline-none focus:border-[#238740] placeholder:text-[#999]"
            />
            {value ? (
                <button
                    onClick={() => onChange("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
                >
                    <X className="h-5 w-5" />
                </button>
            ) : (
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999]" />
            )}
        </div>
    );
}
