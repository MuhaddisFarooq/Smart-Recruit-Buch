"use client";

export default function HelpRail() {
    return (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
            <div className="bg-[#238740] text-white px-2 py-4 rounded-r-sm cursor-pointer hover:bg-[#1d7235] transition-colors">
                <span
                    className="text-xs font-semibold tracking-wider"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                >
                    HELP
                </span>
            </div>
        </div>
    );
}
