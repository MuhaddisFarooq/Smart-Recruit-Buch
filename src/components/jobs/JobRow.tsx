"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Globe, Pencil, EyeOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import StagePillCell from "./StagePillCell";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type Job = {
    id: number;
    job_title: string;
    department?: string;
    location: string;
    status: string;
    hod_name?: string;
    hiring_manager?: string;
    addedBy?: string;
    new_count?: number;
    in_review_count?: number;
    shortlisted_count?: number;
    interview_count?: number;
    selected_count?: number;
    offered_count?: number;
    hired_count?: number;
    advertised_date?: string;
    updatedDate?: string;
};

type JobRowProps = {
    job: Job;
    onClick?: () => void;
    onEdit?: (id: number) => void;
    onUnpublish?: (id: number) => void;
    onDelete?: (id: number) => void;
    canDelete?: boolean;
};

export default function JobRow({ job, onClick, onEdit, onUnpublish, onDelete, canDelete = false }: JobRowProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isActive, setIsActive] = useState(job.status?.toLowerCase() === 'active' || job.status?.toLowerCase() === 'published');
    const menuRef = useRef<HTMLDivElement>(null);

    const handleStatusClick = (status: string) => {
        router.push(`/jobs/${job.id}?status=${status}`);
    };

    const handleToggleStatus = async (checked: boolean) => {
        if (!canDelete && isActive) {
            toast.error("You don't have permission to change status");
            return;
        }

        const newStatus = checked ? "active" : "inactive";
        setIsActive(checked); // Optimistic UI update

        try {
            const res = await fetch(`/api/jobs/${job.id}`, {
                method: "PATCH", // Using PATCH as it's an update
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) {
                throw new Error("Failed to update status");
            }
            toast.success(`Job marked as ${newStatus}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
            setIsActive(!checked); // Revert on failure
        }
    };

    const handleAdvertise = async (e: React.MouseEvent) => {
        e.stopPropagation();
        // ... existing advertise logic
    };

    // ... existing useEffect

    return (
        <div
            onClick={onClick}
            className="flex items-center px-5 py-4 border-b border-[#F0F0F0] hover:bg-[#FAFAFA] cursor-pointer transition-colors"
        >
            {/* Job Info */}
            <div className="w-[22%] min-w-0 pr-3">
                <p className="text-base font-semibold text-[#333] truncate">{job.job_title || "Untitled Job"}</p>
                {job.department && <p className="text-sm text-[#333] truncate mt-0.5">{job.department}</p>}
                <p className="text-sm text-[#666] truncate mt-0.5">{job.location || "No location"}</p>
                <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                        checked={isActive}
                        onCheckedChange={handleToggleStatus}
                        className="data-[state=checked]:bg-[#238740]"
                        disabled={!canDelete && isActive} // Disable switch if can't delete/unpublish
                    />
                    <span className="text-sm text-[#666]">{isActive ? 'Active' : 'Inactive'}</span>
                </div>
            </div>

            {/* HOD */}
            <div className="w-[9%] text-sm text-[#555] truncate pr-2">
                {job.hod_name || '-'}
            </div>

            {/* Hiring Manager */}
            <div className="w-[9%] text-sm text-[#555] truncate pr-2">
                {job.hiring_manager || '-'}
            </div>

            {/* Stage Pills */}
            <div className="w-[7%]">
                <StagePillCell
                    count={job.new_count ?? null}
                    hasDropdown={!!job.new_count}
                    onClick={() => handleStatusClick('new')}
                />
            </div>
            <div className="w-[7%]">
                <StagePillCell
                    count={job.in_review_count ?? null}
                    hasDropdown={!!job.in_review_count}
                    onClick={() => handleStatusClick('reviewed')}
                />
            </div>
            <div className="w-[7%]">
                <StagePillCell
                    count={job.shortlisted_count ?? null}
                    onClick={() => handleStatusClick('shortlisted')}
                />
            </div>
            <div className="w-[7%]">
                <StagePillCell
                    count={job.interview_count ?? null}
                    hasDropdown={!!job.interview_count}
                    onClick={() => handleStatusClick('interview')}
                />
            </div>
            <div className="w-[7%]">
                <StagePillCell
                    count={job.selected_count ?? null}
                    onClick={() => handleStatusClick('selected')}
                />
            </div>
            <div className="w-[7%]">
                <StagePillCell
                    count={job.offered_count ?? null}
                    onClick={() => handleStatusClick('offered')}
                />
            </div>
            <div className="w-[7%]">
                <StagePillCell
                    count={job.hired_count ?? null}
                    onClick={() => handleStatusClick('hired')}
                />
            </div>

            {/* Actions */}
            <div className="w-[6%] flex items-center justify-end gap-1 relative" ref={menuRef}>
                <button
                    onClick={handleAdvertise}
                    className={`p-2 rounded hover:bg-[#F0F0F0] ${job.advertised_date ? 'text-blue-500' : 'text-[#999] hover:text-[#666]'}`}
                    title={job.advertised_date ? "Advertised (Click to re-advertise if updated)" : "Advertise to Website"}
                >
                    <Globe className="h-5 w-5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(!menuOpen);
                    }}
                    className="p-2 text-[#999] hover:text-[#666] rounded hover:bg-[#F0F0F0]"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-[#E6E6E6] rounded-md shadow-lg z-20">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(false);
                                onEdit?.(job.id);
                            }}
                            className="w-full px-4 py-2.5 text-sm text-left text-[#333] hover:bg-[#F5F5F5] flex items-center gap-3"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit job
                        </button>
                        {isActive && canDelete ? ( // Only show if canDelete is true
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onUnpublish?.(job.id);
                                }}
                                className="w-full px-4 py-2.5 text-sm text-left text-[#666] hover:bg-[#F5F5F5] flex items-center gap-3"
                            >
                                <EyeOff className="h-4 w-4" />
                                Unpublish job
                            </button>
                        ) : null}
                        {canDelete && ( // Only show if canDelete is true
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    onDelete?.(job.id);
                                }}
                                className="w-full px-4 py-2.5 text-sm text-left text-[#666] hover:bg-[#F5F5F5] flex items-center gap-3"
                            >
                                <Trash2 className="h-4 w-4" />
                                Cancel job
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
