"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Bell, User, Menu, X, Settings, Users, Store, Newspaper, MessageCircle, HelpCircle, MessageSquare, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Jobs", href: "/jobs" },
    { label: "People", href: "/people" },
];

const profileMenuItems = [
    { label: "Settings", href: "/settings", icon: Settings },
];

export default function TopNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Close profile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: "/" });
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-white border-b border-[#E6E6E6] shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-50 flex items-center px-4 md:px-6 lg:pl-[370px] lg:pr-4">
                {/* Mobile: Hamburger + Logo */}
                <div className="flex items-center gap-4 lg:hidden">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-[#666] hover:text-[#333]"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                    <Link href="/dashboard">
                        <Image
                            src="/Buch_logo-grey.png"
                            alt="Buch International Hospital"
                            width={100}
                            height={24}
                            className="h-6 w-auto object-contain"
                        />
                    </Link>
                </div>

                {/* Desktop: Logo + Nav Links */}
                <div className="hidden lg:flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-1">
                        <Image
                            src="/Buch_logo-grey.png"
                            alt="Buch International Hospital"
                            width={140}
                            height={32}
                            className="h-8 w-auto object-contain"
                        />
                    </Link>

                    <div className="flex items-center gap-6">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative py-5 text-sm font-medium transition-colors ${isActive
                                        ? "text-[#333]"
                                        : "text-[#666] hover:text-[#333]"
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
                </div>

                {/* Right: Search, Bell, Create Job, Avatar */}
                <div className="ml-auto flex items-center gap-2 md:gap-4 lg:ml-[110px]">
                    {/* Search - hidden on mobile, visible on tablet+ */}
                    <div className="relative hidden md:block">
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-[180px] lg:w-[280px] h-9 pl-3 pr-10 text-sm border border-[#D1D1D1] rounded bg-white focus:outline-none focus:border-[#999] placeholder:text-[#999]"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                    </div>

                    {/* Mobile Search Icon */}
                    <button className="p-2 text-[#666] hover:text-[#333] md:hidden">
                        <Search className="h-5 w-5" />
                    </button>

                    {/* Bell */}
                    <button className="p-2 text-[#666] hover:text-[#333] transition-colors">
                        <Bell className="h-5 w-5" />
                    </button>

                    {/* Create Job - hidden on mobile */}
                    <Link
                        href="/jobs/add"
                        className="hidden md:block text-sm font-medium text-[#333] hover:text-[#238740] transition-colors"
                    >
                        Create job
                    </Link>

                    {/* Avatar with Dropdown */}
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#238740] flex items-center justify-center text-white hover:bg-[#1d7235] transition-colors border-2 border-[#238740]"
                        >
                            <User className="h-4 w-4 md:h-5 md:w-5" />
                        </button>

                        {/* Profile Dropdown Menu */}
                        {profileMenuOpen && (
                            <div className="absolute right-0 top-12 w-56 bg-white border border-[#E6E6E6] rounded-md shadow-lg py-2 z-50">
                                {profileMenuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setProfileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#333] hover:bg-[#F5F5F5] transition-colors"
                                    >
                                        <item.icon className="h-4 w-4 text-[#666]" />
                                        {item.label}
                                    </Link>
                                ))}
                                <div className="border-t border-[#E6E6E6] my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#333] hover:bg-[#F5F5F5] transition-colors w-full"
                                >
                                    <LogOut className="h-4 w-4 text-[#666]" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 top-14 bg-white z-40 lg:hidden">
                    <div className="flex flex-col p-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`py-4 text-lg font-medium border-b border-[#E6E6E6] ${isActive
                                        ? "text-[#238740]"
                                        : "text-[#333]"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        <Link
                            href="/jobs/add"
                            onClick={() => setMobileMenuOpen(false)}
                            className="py-4 text-lg font-medium text-[#238740]"
                        >
                            + Create Job
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
