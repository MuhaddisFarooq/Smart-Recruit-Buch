"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Briefcase, Clock, ChevronRight, Building2, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type Job = {
    id: number;
    job_title: string;
    location: string;
    city: string;
    country: string;
    type_of_employment: string;
    company_description: string;
    description: string;
    addedDate: string;
    status: string;
};

// Custom color constants
const THEME_COLOR = "#b9d36c";
const THEME_COLOR_HOVER = "#a3bd5b";
const THEME_BG_LIGHT = "bg-[#b9d36c]/10";

export default function CandidateJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [locationFilter, setLocationFilter] = useState("all");

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/jobs");
            if (res.ok) {
                const data = await res.json();
                // Only show published/active jobs
                const publishedJobs = data.filter((job: Job) =>
                    job.status?.toLowerCase() === 'active' || job.status?.toLowerCase() === 'published'
                );
                setJobs(publishedJobs);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Get unique locations for filter
    const uniqueLocations = useMemo(() => {
        const locs = jobs.map(j => j.city || j.location).filter(Boolean);
        return ["all", ...new Set(locs)];
    }, [jobs]);

    // Filter jobs
    const filteredJobs = useMemo(() => {
        let filtered = [...jobs];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(job =>
                job.job_title?.toLowerCase().includes(query) ||
                job.description?.toLowerCase().includes(query) ||
                job.location?.toLowerCase().includes(query)
            );
        }

        if (locationFilter && locationFilter !== "all") {
            filtered = filtered.filter(job =>
                job.city?.toLowerCase() === locationFilter.toLowerCase() ||
                job.location?.toLowerCase().includes(locationFilter.toLowerCase())
            );
        }

        return filtered;
    }, [jobs, searchQuery, locationFilter]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Posted Today";
        if (diffDays === 1) return "Posted Yesterday";
        if (diffDays < 7) return `Posted ${diffDays} days ago`;
        if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`;
        return `Posted ${Math.floor(diffDays / 30)} months ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#b9d36c]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 font-sans pb-20">
            {/* Hero Section */}
            <div className="relative h-[500px] w-full mb-12">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop")',
                    }}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
                </div>

                <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        Find Your <span className="text-[#b9d36c]">Dream Job</span>
                    </h1>
                    <p className="text-xl text-neutral-200 mb-10 max-w-2xl font-light">
                        Join our team of dedicated professionals at Buch International Hospital and make a difference.
                    </p>

                    {/* Search Components */}
                    <div className="bg-white p-4 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Job title, keywords, or company"
                                className="h-14 pl-12 text-lg border-0 bg-neutral-50 focus-visible:ring-1 focus-visible:ring-[#b9d36c]"
                            />
                        </div>
                        <div className="w-full md:w-72 relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                <MapPin className="h-5 w-5 text-neutral-400" />
                            </div>
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger className="h-14 pl-12 text-lg border-0 bg-neutral-50 focus:ring-1 focus:ring-[#b9d36c]">
                                    <SelectValue placeholder="Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {uniqueLocations.filter(l => l !== 'all').map(loc => (
                                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            className="h-14 px-8 text-lg font-semibold bg-[#b9d36c] hover:bg-[#a3bd5b] text-neutral-900"
                        >
                            Search Jobs
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6">

                {/* Stats / Header */}
                <div className="flex flex-col md:flex-row items-baseline justify-between mb-8 pb-4 border-b border-neutral-200">
                    <h2 className="text-3xl font-bold text-neutral-800">
                        Open Positions <span className="ml-2 text-lg font-normal text-neutral-500">({filteredJobs.length} available)</span>
                    </h2>
                    <div className="text-neutral-500 hidden md:block">
                        Showing all opportunities
                    </div>
                </div>

                {/* Job Grid */}
                {filteredJobs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-neutral-100 p-16 text-center shadow-sm">
                        <div className="bg-neutral-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="h-10 w-10 text-neutral-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-800 mb-2">No jobs found</h3>
                        <p className="text-neutral-500 mb-8 max-w-md mx-auto">
                            We couldn't find any positions matching your search. Try adjusting your filters or check back later.
                        </p>
                        <Button
                            onClick={() => { setSearchQuery(""); setLocationFilter("all"); }}
                            variant="outline"
                            className="text-[#b9d36c] border-[#b9d36c] hover:bg-[#b9d36c]/10"
                        >
                            Clear all filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => router.push(`/candidate/jobs/${job.id}`)}
                                className="group bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:border-[#b9d36c]/50 transition-all duration-300 cursor-pointer flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="bg-[#b9d36c]/10 p-3 rounded-xl group-hover:bg-[#b9d36c] transition-colors duration-300">
                                        <Building2 className="h-6 w-6 text-[#b9d36c] group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded-full uppercase tracking-wide">
                                        {job.type_of_employment || "Full-time"}
                                    </span>
                                </div>

                                <div className="mb-6 flex-grow">
                                    <h3 className="text-xl font-bold text-neutral-800 mb-2 group-hover:text-[#b9d36c] transition-colors">
                                        {job.job_title}
                                    </h3>
                                    <p className="text-neutral-500 line-clamp-2 text-sm">
                                        {job.company_description || "Join our team at Buch International Hospital. We are looking for talented individuals to help us deliver world-class healthcare."}
                                    </p>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-neutral-100">
                                    <div className="flex items-center text-sm text-neutral-600">
                                        <MapPin className="h-4 w-4 mr-2 text-neutral-400" />
                                        {job.city || job.location || "Location not specified"}
                                    </div>

                                    <div className="flex items-center text-sm text-neutral-600">
                                        <Globe className="h-4 w-4 mr-2 text-neutral-400" />
                                        Buch International Hospital
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-2">
                                        <div className="flex items-center text-xs text-neutral-400">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {formatDate(job.addedDate)}
                                        </div>
                                        <span className="text-[#b9d36c] text-sm font-semibold flex items-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                            View Details <ChevronRight className="h-4 w-4 ml-1" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
