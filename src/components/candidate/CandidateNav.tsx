"use client";

import { useRouter } from "next/navigation";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Bell, User, LogOut, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import NotificationBell from "@/components/ui/NotificationBell";

export default function CandidateNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const router = useRouter();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [allJobs, setAllJobs] = useState<any[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Fetch jobs once for search
    useEffect(() => {
        fetch("/api/jobs")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const activeJobs = data.filter((job: any) =>
                        job.status?.toLowerCase() === 'active' || job.status?.toLowerCase() === 'published'
                    );
                    setAllJobs(activeJobs);
                }
            })
            .catch(err => console.error("Failed to fetch jobs for search", err));
    }, []);

    // Filter jobs on type
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();
        const results = allJobs.filter(job =>
            job.job_title?.toLowerCase().includes(query) ||
            job.company_description?.toLowerCase().includes(query)
        ).slice(0, 5); // Limit to 5 results

        setSearchResults(results);
        setSearchOpen(true);
    }, [searchQuery, allJobs]);

    // Close search on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navItems = [
        { label: "Find Jobs", href: "/candidate/jobs" },
        { label: "My Applications", href: "/candidate/applications" },
        { label: "My Messages", href: "/candidate/messages" },
    ];

    const userName = session?.user?.name || "Candidate";
    const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#E6E6E6] shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-50 flex items-center px-6">
            {/* Logo */}
            <Link href="/candidate/jobs" className="flex items-center gap-2 mr-8">
                <Image
                    src="/Buch_logo-grey.png"
                    alt="Buch Smart Recruiter"
                    width={140}
                    height={32}
                    className="h-8 w-auto object-contain"
                />
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-6">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative py-5 text-sm font-medium transition-colors ${isActive ? "text-[#333]" : "text-[#666] hover:text-[#333]"
                                }`}
                        >
                            {item.label}
                            {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#238740]" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <div className="relative mr-4" ref={searchRef}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if (searchQuery) setSearchOpen(true); }}
                    placeholder="Search jobs..."
                    className="w-64 h-9 px-4 pr-10 text-sm border border-[#E6E6E6] rounded-full bg-[#F5F5F5] focus:outline-none focus:border-[#238740] focus:bg-white"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />

                {/* Search Results Dropdown */}
                {searchOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-[#E6E6E6] overflow-hidden z-50">
                        {searchResults.map(job => (
                            <div
                                key={job.id}
                                onClick={() => {
                                    router.push(`/candidate/jobs/${job.id}`);
                                    setSearchOpen(false);
                                    setSearchQuery("");
                                }}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                            >
                                <p className="text-sm font-medium text-gray-900 truncate">{job.job_title}</p>
                                <p className="text-xs text-gray-500 truncate">{job.city || job.location}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
                <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-9 h-9 rounded-full bg-[#238740] text-white text-sm font-medium flex items-center justify-center hover:bg-[#1d7235] transition-colors"
                >
                    {userInitials}
                </button>

                {profileOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-[#E6E6E6] rounded-lg shadow-lg z-50">
                        <div className="px-4 py-3 border-b border-[#E6E6E6]">
                            <p className="text-sm font-medium text-[#333]">{userName}</p>
                            <p className="text-xs text-[#666]">{session?.user?.email}</p>
                        </div>
                        <div className="py-1">
                            <Link
                                href="/candidate/profile"
                                className="flex items-center gap-3 px-4 py-2 text-sm text-[#555] hover:bg-[#F5F5F5]"
                            >
                                <User className="h-4 w-4" />
                                My Profile
                            </Link>
                            <Link
                                href="/candidate/applications"
                                className="flex items-center gap-3 px-4 py-2 text-sm text-[#555] hover:bg-[#F5F5F5]"
                            >
                                <FileText className="h-4 w-4" />
                                My Applications
                            </Link>
                        </div>
                        <div className="border-t border-[#E6E6E6] py-1">
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#666] hover:bg-[#F5F5F5]"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
