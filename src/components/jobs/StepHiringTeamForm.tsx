"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Trash2, ChevronDown, User, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type HiringTeamMember = {
    user_id: string; // Changed from id to user_id to match backend expectation
    name: string;
    email: string;
    role: string;
    initials: string;
    avatar_url?: string;
};

type StepHiringTeamFormProps = {
    formData: any;
    setFormData: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
    onSave: () => void;
    onPublish: () => void;
};

const HIRING_ROLES = [
    "Hiring Manager",
    "Interviewer",
    "Recruiter",
    "Executive",
    "Coordinator",
];

export default function StepHiringTeamForm({
    formData,
    setFormData,
    onNext,
    onBack,
    onSave,
    onPublish
}: StepHiringTeamFormProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [newMemberRole, setNewMemberRole] = useState("");
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const teamMembers: HiringTeamMember[] = formData.hiring_team || [];

    // Debounced Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 2 && !selectedUser) {
                searchUsers(searchTerm);
            } else if (searchTerm.length < 2) {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedUser]);

    // Close search results on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchResults([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchUsers = async (q: string) => {
        setIsSearching(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                // Filter out already added members
                const currentMemberIds = teamMembers.map(m => m.user_id?.toString());
                setSearchResults(data.filter((u: any) => !currentMemberIds.includes(u.id.toString())));
            }
        } catch (error) {
            console.error("Search error", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setSearchTerm(user.name);
        setSearchResults([]);
    };

    const addMember = () => {
        if (!selectedUser) return;

        const initials = selectedUser.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
        const newMember: HiringTeamMember = {
            user_id: selectedUser.id.toString(),
            name: selectedUser.name,
            email: selectedUser.email,
            role: newMemberRole || "Interviewer", // Default role if none selected
            initials,
            avatar_url: selectedUser.avatar_url,
        };

        setFormData({
            ...formData,
            hiring_team: [...teamMembers, newMember]
        });

        // Reset
        setSearchTerm("");
        setSelectedUser(null);
        setNewMemberRole("");
        setSearchResults([]);
    };

    const removeMember = (userId: string) => {
        setFormData({
            ...formData,
            hiring_team: teamMembers.filter(m => m.user_id !== userId),
        });
    };

    const updateMemberRole = (userId: string, role: string) => {
        setFormData({
            ...formData,
            hiring_team: teamMembers.map(m => m.user_id === userId ? { ...m, role } : m),
        });
        setOpenDropdownId(null);
    };

    return (
        <div>
            {/* Section Title */}
            <h2 className="text-lg font-semibold text-[#333] mb-6">Add Hiring team</h2>

            {/* Add Member Row */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 items-start">
                <div className="flex-1 relative" ref={searchRef}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setSelectedUser(null); // Clear selection if typing triggers search again
                        }}
                        className="w-full h-10 px-3 pr-10 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                        placeholder="Enter name or email"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && !selectedUser && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E6E6E6] rounded shadow-lg z-20 max-h-60 overflow-y-auto">
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                    onClick={() => handleSelectUser(user)}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback className="bg-[#238740] text-white text-xs">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] bg-white"
                    >
                        <option value="">Choose hiring role</option>
                        {HIRING_ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    onClick={addMember}
                    disabled={!selectedUser}
                    className={`px-4 py-2 border text-sm font-medium rounded transition-colors whitespace-nowrap ${selectedUser
                        ? "border-[#238740] text-[#238740] hover:bg-[#238740]/5"
                        : "border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    Add to team
                </button>
            </div>

            {/* Members Table */}
            {teamMembers.length > 0 && (
                <div className="border border-[#E6E6E6] rounded mb-6">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_1fr_40px] gap-4 px-4 py-2 bg-[#FAFAFA] border-b border-[#E6E6E6] text-xs text-[#666] font-medium">
                        <span>Name or Email</span>
                        <span>Hiring role</span>
                        <span></span>
                    </div>

                    {/* Members */}
                    {teamMembers.map((member) => (
                        <div
                            key={member.user_id}
                            className="grid grid-cols-[1fr_1fr_40px] gap-4 px-4 py-3 border-b border-[#E6E6E6] last:border-b-0 items-center"
                        >
                            {/* Name */}
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.avatar_url} />
                                    <AvatarFallback className="bg-[#238740] text-white text-xs font-medium">
                                        {member.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm text-[#333] font-medium">{member.name}</div>
                                    <div className="text-xs text-[#666]">{member.email}</div>
                                </div>
                            </div>

                            {/* Role Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setOpenDropdownId(openDropdownId === member.user_id ? null : member.user_id)}
                                    className="w-full h-9 px-3 text-sm border border-[#D1D1D1] rounded bg-white flex items-center justify-between text-left"
                                >
                                    <span className={member.role ? "text-[#333]" : "text-[#999]"}>
                                        {member.role || "Select Hiring Role*"}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-[#999]" />
                                </button>

                                {openDropdownId === member.user_id && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E6E6E6] rounded shadow-lg z-10">
                                        {HIRING_ROLES.map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => updateMemberRole(member.user_id, role)}
                                                className={`w-full px-3 py-2 text-sm text-left hover:bg-[#F5F5F5] ${member.role === role ? "bg-[#F5F5F5] text-[#238740]" : "text-[#333]"
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Delete */}
                            <button
                                type="button"
                                onClick={() => removeMember(member.user_id)}
                                className="p-1 text-[#999] hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#E6E6E6]">
                <button
                    type="button"
                    onClick={onPublish}
                    className="px-5 py-2 bg-[#238740] text-white text-sm font-medium rounded hover:bg-[#1d7235] transition-colors"
                >
                    Publish
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    className="px-5 py-2 border border-[#238740] text-[#238740] text-sm font-medium rounded hover:bg-[#238740]/5 transition-colors"
                >
                    Save
                </button>
            </div>
        </div>
    );
}
