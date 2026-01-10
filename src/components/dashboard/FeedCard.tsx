"use client";

import { User, ChevronDown, FileText } from "lucide-react";

type FeedItem = {
    id: number;
    personName: string;
    hiredBy: string;
    startDate: string;
    jobTitle: string;
    location: string;
    date: string;
    avatarUrl?: string;
};

const mockFeedItems: FeedItem[] = [
    {
        id: 1,
        personName: "Ghazanfar Abbas",
        hiredBy: "Hafsa Basheer",
        startDate: "May 7, 2022",
        jobTitle: "Mobile Application Developer",
        location: "Multan, Pakistan, Multan, Pakistan",
        date: "May 7, 2022",
    },
    {
        id: 2,
        personName: "Ghyyour Ul Hassan",
        hiredBy: "Hafsa Basheer",
        startDate: "February 17, 2022",
        jobTitle: "Help Desk Executive (IT)",
        location: "Multan, Pakistan, Multan, Pakistan",
        date: "Feb 17, 2022",
    },
    {
        id: 3,
        personName: "Muhammad Abdullah",
        hiredBy: "Hafsa Basheer",
        startDate: "February 17, 2022",
        jobTitle: "Web Application Developer",
        location: "Multan, Pakistan, Multan, Pakistan",
        date: "Feb 17, 2022",
        avatarUrl: "/avatars/default.png",
    },
    {
        id: 4,
        personName: "Tauqeer Ahmed",
        hiredBy: "Hafsa Basheer",
        startDate: "January 18, 2022",
        jobTitle: "Help Desk Executive (IT)",
        location: "Multan, Pakistan, Multan, Pakistan",
        date: "Jan 18, 2022",
    },
];

export default function FeedCard() {
    return (
        <div className="bg-white border border-[#E6E6E6] rounded shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
            {/* Composer Row */}
            <div className="bg-[#F6FAF6] px-3 md:px-5 py-3 md:py-4 flex items-center gap-3 md:gap-4 border-b border-[#E6E6E6]">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#E6E6E6] flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 md:h-6 md:w-6 text-[#999]" />
                </div>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Share something with your team..."
                        className="w-full h-10 md:h-11 pl-3 md:pl-4 pr-10 text-sm md:text-base border border-[#D1D1D1] rounded bg-white focus:outline-none focus:border-[#999] placeholder:text-[#999]"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-[#666]" />
                </div>
            </div>

            {/* Feed Items */}
            <div className="divide-y divide-[#EAEAEA]">
                {mockFeedItems.map((item) => (
                    <div key={item.id} className="px-3 md:px-5 py-4 md:py-5 flex gap-3 md:gap-4">
                        {/* Icon */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#F0F4F0] flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 md:h-6 md:w-6 text-[#666]" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base text-[#333] leading-relaxed">
                                <span className="font-semibold">{item.personName}</span>
                                {" "}has been hired by{" "}
                                <span className="text-[#238740]">{item.hiredBy}</span>
                                {" "}and starts on{" "}
                                <span className="text-[#238740]">{item.startDate}</span>
                                {" "}as{" "}
                                <span className="font-semibold">{item.jobTitle}</span>
                                {" "}in{" "}
                                <span className="text-[#238740]">{item.location}</span>
                            </p>
                            <p className="text-xs md:text-sm text-[#999] mt-2 md:mt-3">{item.date}</p>

                            {/* Small avatar below date */}
                            <div className="mt-2">
                                {item.avatarUrl ? (
                                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#238740] flex items-center justify-center">
                                        <User className="h-3 w-3 md:h-4 md:w-4 text-white" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#E6E6E6] flex items-center justify-center">
                                        <User className="h-3 w-3 md:h-4 md:w-4 text-[#999]" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
