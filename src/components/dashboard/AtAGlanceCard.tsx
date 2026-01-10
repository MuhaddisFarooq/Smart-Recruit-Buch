"use client";

type StatItem = {
    value: string | number;
    label: string;
};

const stats: StatItem[] = [
    { value: 61, label: "ACTIVE JOBS" },
    { value: "17,579", label: "TOTAL CANDIDATES" },
    { value: "5,097", label: "NEW CANDIDATES" },
];

export default function AtAGlanceCard() {
    return (
        <div className="bg-white border border-[#E6E6E6] rounded shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
            {/* Header */}
            <div className="px-4 md:px-5 py-3 md:py-4 border-b border-[#E6E6E6]">
                <h3 className="text-sm md:text-base font-medium text-[#333]">At-a-Glance</h3>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 divide-x divide-[#E6E6E6]">
                {stats.map((stat, index) => (
                    <div key={index} className="py-4 md:py-5 px-2 md:px-3 text-center">
                        <p className="text-xl md:text-3xl font-light text-[#333]">{stat.value}</p>
                        <p className="text-[9px] md:text-xs font-medium text-[#238740] mt-1 md:mt-2 tracking-wide leading-tight">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
