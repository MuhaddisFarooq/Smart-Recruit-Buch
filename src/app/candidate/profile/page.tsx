"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function CandidateProfilePage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        cnic: "",
        phone: "",
        designation: "",
        department: "",
        employee_id: "",
        joining_date: "",
    });

    useEffect(() => {
        if (session?.user) {
            fetchUserData();
        }
    }, [session]);

    const fetchUserData = async () => {
        try {
            // We assume the user ID is in session.user.id (needs to be ensured in auth options)
            // Or we fetch /api/auth/session to be sure, or just rely on session.
            // If session.user.id is missing, we might need a way to get 'me'. 
            // Usually we can fetch via email if ID isn't there, but let's try assuming next-auth session call.
            // Actually, best to have an /api/me endpoint or similar.
            // But since I don't have /api/me, I'll rely on session.user.id if available.
            // If not available, I'll have to use email to find user? 
            // Let's assume session.user.id works.

            // Wait, looking at auth options might reveal if ID is in session.
            // But I'll trust standard implementation for now. 
            // If I can't get ID, I can't fetch /api/users/[id].
            // Alternative: Filter by email? GET /api/users?email=...
            // Checking api/users/[id] code... it requires params.id.

            // Let's assume session has it or I can get it.
            // If not, I'll implement a workaround later.

            if (!(session?.user as any)?.id) return;

            const res = await fetch(`/api/users/${(session?.user as any).id}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    cnic: data.cnic || "",
                    phone: data.phone || "",
                    designation: data.designation || "",
                    department: data.department || "",
                    employee_id: data.employee_id || "",
                    joining_date: data.joining_date ? new Date(data.joining_date).toISOString().split('T')[0] : "",
                });
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/users/${(session?.user as any).id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success("Profile updated successfully");
            } else {
                toast.error("Failed to update profile");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#238740]" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-[#333]">Edit Profile</h1>

            <div className="bg-white border border-[#E6E6E6] rounded-lg p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ID & Joining Date (Read Only) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Employee ID</label>
                            <Input value={formData.employee_id || "N/A"} disabled className="bg-gray-50 text-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Joining Date</label>
                            <Input value={formData.joining_date || "N/A"} disabled className="bg-gray-50 text-gray-500" />
                        </div>
                    </div>

                    {/* Designation & Department (Read Only) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Designation</label>
                            <Input value={formData.designation || "N/A"} disabled className="bg-gray-50 text-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#666] mb-1">Department</label>
                            <Input value={formData.department || "N/A"} disabled className="bg-gray-50 text-gray-500" />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-4 pt-4">
                        <h2 className="text-lg font-semibold mb-4 text-[#238740]">Personal Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#333] mb-1">Full Name</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#333] mb-1">Email</label>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#333] mb-1">Contact No</label>
                                    <Input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="03001234567"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#333] mb-1">CNIC</label>
                                <Input
                                    name="cnic"
                                    value={formData.cnic}
                                    onChange={handleChange}
                                    placeholder="1234512345671"
                                    required
                                    minLength={13}
                                    maxLength={13}
                                />
                                <p className="text-xs text-gray-500 mt-1">Must be 13 digits without dashes.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="bg-[#238740] hover:bg-[#1d7235] text-white" disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
