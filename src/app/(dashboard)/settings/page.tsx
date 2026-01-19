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
    department?: string; // New field
    designation?: string; // New field
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
        department: "",
        designation: "",
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
        // Name is now managed externally, so validation is less critical here, 
        // but keeping it doesn't hurt if we allow editing other things.

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
        // Disabled for externally managed profiles
        toast.info("Profile photo is managed by your organization.");
        return;
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
                        <p className="text-xs text-[#666] mb-3">Profile photo <span className="text-xs text-[#999]">(Managed by Org)</span></p>
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
                            {/* Hidden upload for external users */}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-[#666] mb-1">Department <span className="text-[#999]">🔒</span></label>
                            <input
                                type="text"
                                value={profile.department || ""}
                                disabled
                                className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded bg-[#F5F5F5] text-[#666] cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#666] mb-1">Designation <span className="text-[#999]">🔒</span></label>
                            <input
                                type="text"
                                value={profile.designation || ""}
                                disabled
                                className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded bg-[#F5F5F5] text-[#666] cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#666] mb-1">Position (Job Title) <span className="text-[#999]">🔒</span></label>
                            <input
                                type="text"
                                value={profile.position || ""}
                                disabled
                                className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded bg-[#F5F5F5] text-[#666] cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#666] mb-1">Email <span className="text-[#999]">🔒</span></label>
                            <input
                                type="email"
                                value={profile.email || ""}
                                disabled
                                className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded bg-[#F5F5F5] text-[#666]"
                            />
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
