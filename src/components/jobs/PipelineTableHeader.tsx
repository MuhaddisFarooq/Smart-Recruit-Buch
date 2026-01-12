"use client";

import { SlidersHorizontal, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
} | null;

type PipelineTableHeaderProps = {
    totalJobs: number;
    sortConfig: SortConfig;
    onSort: (key: string) => void;
};

export default function PipelineTableHeader({ totalJobs, sortConfig, onSort }: PipelineTableHeaderProps) {
    const renderSortIcon = (key: string) => {
        if (sortConfig?.key === key) {
            return sortConfig.direction === 'asc'
                ? <ArrowUp className="h-4 w-4 ml-1" />
                : <ArrowDown className="h-4 w-4 ml-1" />;
        }
        return <ArrowUpDown className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-30" />;
    };

    const SortableHeader = ({ label, sortKey, className }: { label: string, sortKey: string, className?: string }) => (
        <div
            className={cn("flex items-center cursor-pointer group select-none hover:text-[#333]", className)}
            onClick={() => onSort(sortKey)}
        >
            {label}
            {renderSortIcon(sortKey)}
        </div>
    );

    return (
        <div className="flex items-center px-5 py-4 border-b border-[#EEEEEE] text-sm font-medium text-[#666] bg-[#FAFAFA]">
            <div className="w-[28%] text-[#333] text-base font-semibold">Jobs ({totalJobs})</div>

            <div className="w-[12%]">
                <SortableHeader label="Recruiter" sortKey="recruiter" />
            </div>

            <div className="w-[12%]">
                <SortableHeader label="Hiring Manager" sortKey="hiring_manager" />
            </div>

            <div className="w-[8%] flex justify-center">
                <SortableHeader label="New" sortKey="new_count" />
            </div>
            <div className="w-[8%] flex justify-center">
                <SortableHeader label="In-review" sortKey="in_review_count" />
            </div>
            <div className="w-[8%] flex justify-center">
                <SortableHeader label="Interview" sortKey="interview_count" />
            </div>
            <div className="w-[8%] flex justify-center">
                <SortableHeader label="Offered" sortKey="offered_count" />
            </div>
            <div className="w-[8%] flex justify-center">
                <SortableHeader label="Hired" sortKey="hired_count" />
            </div>

            <div className="w-[8%] flex justify-end">
                <SlidersHorizontal className="h-5 w-5 text-[#999]" />
            </div>
        </div>
    );
}
