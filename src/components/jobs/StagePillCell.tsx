"use client";

import { ChevronDown } from "lucide-react";

type StagePillCellProps = {
    count: number | null;
    hasDropdown?: boolean;
};

export default function StagePillCell({ count, hasDropdown = false, onClick }: { count: number | null, hasDropdown?: boolean, onClick?: () => void }) {
    if (count === null || count === undefined) {
        return (
            <div className="flex justify-center">
                <div className="w-12 h-9 bg-[#EEF6EE] rounded-md flex items-center justify-center text-sm text-[#666]">
                    -
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center">
            <div
                onClick={(e) => {
                    if (onClick) {
                        e.stopPropagation();
                        onClick();
                    }
                }}
                className={`min-w-[48px] h-9 px-3 bg-[#EEF6EE] rounded-md flex items-center justify-center gap-1 text-sm font-medium text-[#333] ${onClick ? 'cursor-pointer hover:bg-[#dcecdc]' : ''}`}
            >
                <span>{count}</span>
                {hasDropdown && <ChevronDown className="h-3.5 w-3.5 text-[#666]" />}
            </div>
        </div>
    );
}
