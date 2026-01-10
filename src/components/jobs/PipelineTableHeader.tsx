"use client";

import { SlidersHorizontal } from "lucide-react";

type PipelineTableHeaderProps = {
    totalJobs: number;
};

export default function PipelineTableHeader({ totalJobs }: PipelineTableHeaderProps) {
    return (
        <div className="flex items-center px-5 py-4 border-b border-[#EEEEEE] text-sm font-medium text-[#666] bg-[#FAFAFA]">
            <div className="w-[28%] text-[#333] text-base font-semibold">Jobs ({totalJobs})</div>
            <div className="w-[12%]">Recruiter</div>
            <div className="w-[12%]">Hiring Manager</div>
            <div className="w-[8%] text-center">New</div>
            <div className="w-[8%] text-center">In-review</div>
            <div className="w-[8%] text-center">Interview</div>
            <div className="w-[8%] text-center">Offered</div>
            <div className="w-[8%] text-center">Hired</div>
            <div className="w-[8%] flex justify-end">
                <SlidersHorizontal className="h-5 w-5 text-[#999]" />
            </div>
        </div>
    );
}
