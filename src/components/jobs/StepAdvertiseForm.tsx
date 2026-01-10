"use client";

import { ArrowRight, Share2, Globe, Linkedin, Facebook, Twitter, Link as LinkIcon, Copy, Check } from "lucide-react";
import { useState } from "react";

type StepAdvertiseFormProps = {
    formData: any;
    setFormData: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
};

const JOB_BOARDS = [
    { name: "LinkedIn", icon: Linkedin, connected: true },
    { name: "Indeed", icon: Globe, connected: false },
    { name: "Glassdoor", icon: Globe, connected: false },
    { name: "Monster", icon: Globe, connected: false },
];

export default function StepAdvertiseForm({ formData, setFormData, onNext, onBack }: StepAdvertiseFormProps) {
    const [selectedBoards, setSelectedBoards] = useState<string[]>(["LinkedIn"]);

    const toggleBoard = (name: string) => {
        setSelectedBoards(prev =>
            prev.includes(name)
                ? prev.filter(b => b !== name)
                : [...prev, name]
        );
    };

    return (
        <div>
            <h2 className="text-lg font-semibold text-[#238740] mb-6">Advertise your job</h2>

            <p className="text-sm text-[#666] mb-6">
                Select where you want to post your job listing. Connect your accounts to automatically share.
            </p>

            {/* Job Boards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {JOB_BOARDS.map((board) => (
                    <label
                        key={board.name}
                        className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-colors ${selectedBoards.includes(board.name)
                                ? "border-[#238740] bg-[#238740]/5"
                                : "border-[#E6E6E6] hover:border-[#D1D1D1]"
                            }`}
                    >
                        <input
                            type="checkbox"
                            checked={selectedBoards.includes(board.name)}
                            onChange={() => toggleBoard(board.name)}
                            className="w-4 h-4 accent-[#238740]"
                        />
                        <board.icon className="w-6 h-6 text-[#666]" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-[#333]">{board.name}</p>
                            <p className="text-xs text-[#666]">
                                {board.connected ? "Connected" : "Not connected"}
                            </p>
                        </div>
                    </label>
                ))}
            </div>

            {/* Premium Posting */}
            <div className="bg-[#FFF8E7] border border-[#F0C36D] rounded p-4 mb-6">
                <h3 className="text-sm font-medium text-[#333] mb-2">🚀 Boost your job visibility</h3>
                <p className="text-xs text-[#666]">
                    Upgrade to premium posting to reach 3x more candidates and appear at the top of search results.
                </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-[#E6E6E6]">
                <button
                    type="button"
                    onClick={onNext}
                    className="flex items-center gap-2 px-5 py-2 bg-[#238740] text-white text-sm font-medium rounded hover:bg-[#1d7235] transition-colors"
                >
                    Next
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
