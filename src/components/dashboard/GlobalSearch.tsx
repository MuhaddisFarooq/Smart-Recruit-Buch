"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, User, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type SearchResult = {
    application_id: number;
    user_id: number;
    name: string;
    email: string;
    job_title: string;
    status: string;
};

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                performSearch(query);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (q: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/search/candidates?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
                setShowResults(true);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (result: SearchResult) => {
        setQuery("");
        setShowResults(false);
        router.push(`/people/${result.application_id}`);
    };

    return (
        <div className="relative hidden md:block" ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.length >= 2) setShowResults(true);
                    }}
                    placeholder="Search candidates..."
                    className="w-[180px] lg:w-[320px] h-9 pl-3 pr-10 text-sm border border-[#D1D1D1] rounded bg-white focus:outline-none focus:border-[#b9d36c] placeholder:text-[#999] transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666]">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                </div>
            </div>

            {showResults && (query.length >= 2) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 max-h-[400px] overflow-y-auto">
                    {results.length > 0 ? (
                        <>
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Candidates
                            </div>
                            {results.map((result) => (
                                <div
                                    key={result.application_id}
                                    onClick={() => handleSelect(result)}
                                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                                >
                                    <Avatar className="h-8 w-8 bg-purple-100 text-purple-600 border border-purple-200">
                                        <AvatarFallback className="text-xs font-bold">
                                            {result.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {result.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" />
                                            {result.job_title}
                                        </p>
                                    </div>
                                    <div className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${['new', 'applied'].includes(result.status.toLowerCase()) ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            ['hired', 'offered'].includes(result.status.toLowerCase()) ? 'bg-green-50 text-green-700 border-green-100' :
                                                'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}>
                                        {result.status}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            No candidates found for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
