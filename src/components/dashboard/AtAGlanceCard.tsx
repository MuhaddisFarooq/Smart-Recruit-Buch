"use client";

import { useEffect, useState } from "react";

type StatItem = {
    value: string | number;
    label: string;
};

export default function AtAGlanceCard() {
    const [stats, setStats] = useState<StatItem[]>([
        { value: "-", label: "ACTIVE JOBS" },
        { value: "-", label: "TOTAL CANDIDATES" },
        { value: "-", label: "NEW CANDIDATES" },
    ]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/dashboard/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats([
                        { value: data.activeJobs.toLocaleString(), label: "ACTIVE JOBS" },
                        { value: data.totalCandidates.toLocaleString(), label: "TOTAL CANDIDATES" },
                        { value: data.newCandidates.toLocaleString(), label: "NEW CANDIDATES" },
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };

        fetchStats();
    }, []);

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
