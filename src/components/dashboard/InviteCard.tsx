"use client";

import { Plus } from "lucide-react";

export default function InviteCard() {
    return (
        <div className="bg-white border border-[#E6E6E6] rounded shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-base font-medium text-[#333]">Invite Your Team</span>
                <button className="text-[#666] hover:text-[#238740] transition-colors">
                    <Plus className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
}
