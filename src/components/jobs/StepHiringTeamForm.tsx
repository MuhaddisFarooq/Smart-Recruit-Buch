"use client";

import { useState } from "react";
import { Search, Trash2, ChevronDown, User } from "lucide-react";

type HiringTeamMember = {
    id: string;
    name: string;
    email: string;
    role: string;
    initials: string;
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
    const [newMemberName, setNewMemberName] = useState("");
    const [newMemberRole, setNewMemberRole] = useState("");
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const teamMembers: HiringTeamMember[] = formData.hiring_team || [];

    const addMember = () => {
        if (!newMemberName.trim()) return;

        const initials = newMemberName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        const newMember: HiringTeamMember = {
            id: Date.now().toString(),
            name: newMemberName,
            email: newMemberName.includes("@") ? newMemberName : "",
            role: newMemberRole,
            initials,
        };

        setFormData({
            ...formData,
            hiring_team: [...teamMembers, newMember]
        });
        setNewMemberName("");
        setNewMemberRole("");
    };

    const removeMember = (id: string) => {
        setFormData({
            ...formData,
            hiring_team: teamMembers.filter(m => m.id !== id),
        });
    };

    const updateMemberRole = (id: string, role: string) => {
        setFormData({
            ...formData,
            hiring_team: teamMembers.map(m => m.id === id ? { ...m, role } : m),
        });
        setOpenDropdownId(null);
    };

    return (
        <div>
            {/* Section Title */}
            <h2 className="text-lg font-semibold text-[#333] mb-6">Add Hiring team</h2>

            {/* Add Member Row */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full h-10 px-3 pr-10 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                        placeholder="Enter name or email"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
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
                    className="px-4 py-2 border border-[#238740] text-[#238740] text-sm font-medium rounded hover:bg-[#238740]/5 transition-colors whitespace-nowrap"
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
                            key={member.id}
                            className="grid grid-cols-[1fr_1fr_40px] gap-4 px-4 py-3 border-b border-[#E6E6E6] last:border-b-0 items-center"
                        >
                            {/* Name */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#238740] flex items-center justify-center text-white text-xs font-medium">
                                    {member.initials}
                                </div>
                                <span className="text-sm text-[#333]">{member.name}</span>
                            </div>

                            {/* Role Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)}
                                    className="w-full h-9 px-3 text-sm border border-[#D1D1D1] rounded bg-white flex items-center justify-between text-left"
                                >
                                    <span className={member.role ? "text-[#333]" : "text-[#999]"}>
                                        {member.role || "Select Hiring Role*"}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-[#999]" />
                                </button>

                                {openDropdownId === member.id && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E6E6E6] rounded shadow-lg z-10">
                                        {HIRING_ROLES.map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => updateMemberRole(member.id, role)}
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
                                onClick={() => removeMember(member.id)}
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
                    disabled
                    className="px-5 py-2 bg-[#9CA3AF] text-white text-sm font-medium rounded cursor-not-allowed"
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
