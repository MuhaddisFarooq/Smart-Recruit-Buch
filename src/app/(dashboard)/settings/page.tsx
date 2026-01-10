"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type UserProfile = {
    id: number;
    email: string;
    name: string;
    first_name: string;
    last_name: string;
    position: string;
    show_profile_on_jobs: boolean;
    street_address: string;
    city: string;
    country: string;
    zip_code: string;
    work_phone_code: string;
    work_phone: string;
    cell_phone_code: string;
    cell_phone: string;
    avatar_url: string;
};

const COUNTRY_CODES = [
    { code: "+1", country: "US" },
    { code: "+44", country: "UK" },
    { code: "+92", country: "PK" },
    { code: "+91", country: "IN" },
    { code: "+971", country: "UAE" },
    { code: "+966", country: "SA" },
    { code: "+49", country: "DE" },
    { code: "+33", country: "FR" },
    { code: "+86", country: "CN" },
    { code: "+81", country: "JP" },
];

const COUNTRIES = [
    "Afghanistan", "Australia", "Bangladesh", "Canada", "China", "Egypt", "France",
    "Germany", "India", "Indonesia", "Iran", "Iraq", "Italy", "Japan", "Malaysia",
    "Mexico", "Netherlands", "Pakistan", "Philippines", "Russia", "Saudi Arabia",
    "South Africa", "South Korea", "Spain", "Turkey", "UAE", "UK", "USA", "Vietnam"
];

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivating, setDeactivating] = useState(false);

    const [profile, setProfile] = useState<UserProfile>({
        id: 0,
        email: "",
        name: "",
        first_name: "",
        last_name: "",
        position: "",
        show_profile_on_jobs: false,
        street_address: "",
        city: "",
        country: "",
        zip_code: "",
        work_phone_code: "",
        work_phone: "",
        cell_phone_code: "",
        cell_phone: "",
        avatar_url: "",
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        } else if (status === "authenticated") {
            fetchProfile();
        }
    }, [status]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/users/me`);
            if (res.ok) {
                const data = await res.json();
                setProfile({ ...profile, ...data });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile.first_name || !profile.last_name) {
            toast.error("First name and last name are required");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/users/me`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });

            if (res.ok) {
                toast.success("Profile saved successfully");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to save profile");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivateAccount = async () => {
        setDeactivating(true);
        try {
            const res = await fetch(`/api/users/me`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Account deactivated successfully");
                await signOut({ redirect: true, callbackUrl: "/" });
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to deactivate account");
            }
        } catch (error) {
            console.error("Error deactivating account:", error);
            toast.error("An error occurred");
        } finally {
            setDeactivating(false);
            setShowDeactivateModal(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/uploads?folder=avatars", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setProfile({ ...profile, avatar_url: data.url });
                toast.success("Photo uploaded");
            }
        } catch (error) {
            toast.error("Failed to upload photo");
        }
    };

    const getInitials = () => {
        const first = profile.first_name?.[0] || "";
        const last = profile.last_name?.[0] || "";
        return (first + last).toUpperCase() || "?";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#238740]"></div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-3xl mx-auto bg-white min-h-screen">
                {/* Header */}
                <div className="sticky top-14 md:top-16 bg-white border-b border-[#E6E6E6] px-4 md:px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-[#666] hover:text-[#333]">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-lg font-medium text-[#333]">My profile</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="text-sm text-[#666] hover:text-[#333]">
                            Cancel
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-1.5 bg-[#238740] text-white text-sm font-medium rounded hover:bg-[#1d7235] transition-colors disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>

                <div className="px-4 md:px-6 py-6 space-y-8">
                    {/* Profile Photo */}
                    <div>
                        <p className="text-xs text-[#666] mb-3">Profile photo</p>
                        <div className="flex items-center gap-4">
                            {profile.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-[#6B7C3F] flex items-center justify-center text-white text-xl font-medium">
                                    {getInitials()}
                                </div>
                            )}
                            <label className="text-[#238740] text-sm cursor-pointer hover:underline">
                                Choose an image
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </label>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-[#666] mb-1">First name<span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={profile.first_name || ""}
                                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                placeholder="First name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#666] mb-1">Last name<span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={profile.last_name || ""}
                                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                placeholder="Last name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#666] mb-1">Position</label>
                            <input
                                type="text"
                                value={profile.position || ""}
                                onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                                className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                placeholder="Add position"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#666] mb-1">Email <span className="text-[#999]">ⓘ</span></label>
                            <input
                                type="email"
                                value={profile.email || ""}
                                disabled
                                className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded bg-[#F5F5F5] text-[#666]"
                            />
                        </div>
                    </div>

                    {/* Show profile checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={profile.show_profile_on_jobs || false}
                            onChange={(e) => setProfile({ ...profile, show_profile_on_jobs: e.target.checked })}
                            className="w-4 h-4 accent-[#238740]"
                        />
                        <span className="text-sm text-[#333]">Show my name and social profile on job ads I post</span>
                    </label>

                    {/* Contact Information */}
                    <div>
                        <h2 className="text-base font-medium text-[#333] mb-1">Contact information</h2>
                        <p className="text-xs text-[#666] mb-4">Used in merge fields or email templates</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-[#666] mb-1">Street address</label>
                                <input
                                    type="text"
                                    value={profile.street_address || ""}
                                    onChange={(e) => setProfile({ ...profile, street_address: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                    placeholder="Add street address"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#666] mb-1">City</label>
                                <input
                                    type="text"
                                    value={profile.city || ""}
                                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                    placeholder="Add city"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#666] mb-1">Country</label>
                                <div className="relative">
                                    <select
                                        value={profile.country || ""}
                                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                        className="w-full h-10 px-3 pr-10 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] appearance-none bg-white"
                                    >
                                        <option value="">Select country</option>
                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-[#666] mb-1">Zip/postal code</label>
                                <input
                                    type="text"
                                    value={profile.zip_code || ""}
                                    onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })}
                                    className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                    placeholder="Add Zip/postal code"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#666] mb-1">Work phone</label>
                                <div className="flex gap-2">
                                    <select
                                        value={profile.work_phone_code || ""}
                                        onChange={(e) => setProfile({ ...profile, work_phone_code: e.target.value })}
                                        className="w-20 h-10 px-2 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                    >
                                        <option value=""></option>
                                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                    </select>
                                    <input
                                        type="tel"
                                        value={profile.work_phone || ""}
                                        onChange={(e) => setProfile({ ...profile, work_phone: e.target.value })}
                                        className="flex-1 h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                        placeholder="301 2345678"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-[#666] mb-1">Cell phone</label>
                                <div className="flex gap-2">
                                    <select
                                        value={profile.cell_phone_code || ""}
                                        onChange={(e) => setProfile({ ...profile, cell_phone_code: e.target.value })}
                                        className="w-20 h-10 px-2 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                    >
                                        <option value=""></option>
                                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                    </select>
                                    <input
                                        type="tel"
                                        value={profile.cell_phone || ""}
                                        onChange={(e) => setProfile({ ...profile, cell_phone: e.target.value })}
                                        className="flex-1 h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                        placeholder="301 2345678"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Section */}
                    <div className="border-t border-[#E6E6E6] pt-6">
                        <h2 className="text-base font-medium text-[#333] mb-2">Account</h2>
                        <p className="text-xs text-[#666] mb-4">After deactivation you will no longer be able to use your account. This can't be undone.</p>
                        <button
                            onClick={() => setShowDeactivateModal(true)}
                            className="px-4 py-2 border border-red-500 text-red-500 text-sm rounded hover:bg-red-50 transition-colors"
                        >
                            Deactivate account
                        </button>
                    </div>
                </div>
            </div>

            {/* Deactivate Account Modal */}
            {showDeactivateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <h3 className="text-lg font-medium text-[#333]">Deactivate Account</h3>
                        </div>

                        <p className="text-sm text-[#666] mb-6">
                            Are you sure you want to deactivate your account? This action <strong>cannot be undone</strong> and you will permanently lose access to:
                        </p>

                        <ul className="text-sm text-[#666] mb-6 space-y-2">
                            <li>• Your profile and all personal data</li>
                            <li>• Job applications and history</li>
                            <li>• All account settings</li>
                        </ul>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeactivateModal(false)}
                                className="px-4 py-2 text-sm text-[#666] hover:text-[#333] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeactivateAccount}
                                disabled={deactivating}
                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {deactivating ? "Deactivating..." : "Yes, deactivate my account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
