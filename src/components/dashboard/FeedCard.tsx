"use client";

import { User, ChevronDown, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export default function FeedCard() {
    const [feedItems, setFeedItems] = useState<any[]>([]); // Use any for mixed types
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [posting, setPosting] = useState(false);

    const fetchFeed = async () => {
        try {
            const res = await fetch("/api/dashboard/feed");
            if (res.ok) {
                const data = await res.json();
                setFeedItems(data);
            }
        } catch (error) {
            console.error("Failed to fetch feed:", error);
            // toast.error("Failed to load activity feed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, []);

    const handlePost = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && message.trim()) {
            setPosting(true);
            try {
                const res = await fetch("/api/dashboard/feed", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: message })
                });

                if (res.ok) {
                    setMessage("");
                    toast.success("Message posted");
                    fetchFeed(); // Refresh feed
                } else {
                    toast.error("Failed to post message");
                }
            } catch (err) {
                console.error(err);
                toast.error("Error posting message");
            } finally {
                setPosting(false);
            }
        }
    };

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
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handlePost}
                        disabled={posting}
                        placeholder="Share something with your team..."
                        className="w-full h-10 md:h-11 pl-3 md:pl-4 pr-10 text-sm md:text-base border border-[#D1D1D1] rounded bg-white focus:outline-none focus:border-[#999] placeholder:text-[#999] disabled:opacity-50"
                    />
                    {posting ? (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-[#666] animate-spin" />
                    ) : (
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-[#666]" />
                    )}
                </div>
            </div>

            {/* Feed Items */}
            <div className="divide-y divide-[#EAEAEA]">
                {loading ? (
                    <div className="p-8 flex justify-center text-gray-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : feedItems.length > 0 ? (
                    feedItems.map((item) => (
                        <div key={item.id} className="px-3 md:px-5 py-4 md:py-5 flex gap-3 md:gap-4">
                            {/* Icon */}
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'post' ? 'bg-[#E6E6E6]' : 'bg-[#F0F4F0]'}`}>
                                {item.type === 'post' ? (
                                    <User className="h-5 w-5 md:h-6 md:w-6 text-[#666]" />
                                ) : (
                                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-[#666]" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {item.type === 'post' ? (
                                    // Manual Post UI
                                    <div>
                                        <p className="text-sm md:text-base text-[#333] font-semibold">
                                            {item.authorName}
                                        </p>
                                        <p className="text-sm md:text-base text-[#555] mt-1 leading-relaxed">
                                            {item.content}
                                        </p>
                                    </div>
                                ) : (
                                    // Hired Event UI
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
                                )}
                                <p className="text-xs md:text-sm text-[#999] mt-2 md:mt-3">{item.date}</p>

                                {/* Small avatar below date (optional, kept from original design) */}
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
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-500 italic">
                        No recent activity
                    </div>
                )}
            </div>
        </div>
    );
}
