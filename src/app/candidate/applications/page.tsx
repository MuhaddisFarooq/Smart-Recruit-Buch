"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, MapPin, Clock, ExternalLink, CheckCircle, XCircle, AlertCircle, Building2, Calendar, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Application = {
    id: number;
    job_id: number;
    job_title: string;
    location: string;
    city: string;
    country: string;
    status: string;
    applied_at: string;
};

// Unified Status Configuration
const statusConfig: { [key: string]: { color: string; bg: string; border: string; icon: any; label: string } } = {
    Applied: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: AlertCircle, label: "Applied" },
    new: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: AlertCircle, label: "Under Review" },
    reviewed: { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", icon: AlertCircle, label: "Reviewed" },
    shortlisted: { color: "text-[#b9d36c]", bg: "bg-[#b9d36c]/10", border: "border-[#b9d36c]/20", icon: CheckCircle, label: "Shortlisted" },
    interview: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", icon: AlertCircle, label: "Interview" },
    offered: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: CheckCircle, label: "Offer Extended" },
    hired: { color: "text-green-700", bg: "bg-green-100", border: "border-green-200", icon: CheckCircle, label: "Hired" },
    rejected: { color: "text-red-600", bg: "bg-red-50", border: "border-red-100", icon: XCircle, label: "Not Selected" },
};

const CUSTOM_GREEN = "text-[#b9d36c]";
const CUSTOM_GREEN_BG = "bg-[#b9d36c]";
const CUSTOM_GREEN_BORDER = "border-[#b9d36c]";

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await fetch("/api/job-applications");
            if (res.ok) {
                const data = await res.json();
                setApplications(data);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const filteredApplications = applications.filter(app =>
        app.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-4 ${CUSTOM_GREEN_BORDER}`}></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative font-sans">
            {/* Background Image with Overlay */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop")',
                }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
            </div>

            <div className="relative z-10 container max-w-5xl mx-auto py-12 px-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <Link href="/candidate/jobs" className="flex items-center text-white/70 hover:text-white mb-4 transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Jobs
                        </Link>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">My Applications</h1>
                        <p className="text-lg text-white/80 font-light">Track the status of your current job applications.</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search applications..."
                            className="h-14 pl-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 rounded-xl"
                        />
                    </div>
                </div>

                {/* Applications List */}
                <div className="space-y-6">
                    {applications.length === 0 ? (
                        <div className="bg-white rounded-2xl p-16 text-center shadow-2xl">
                            <div className="bg-neutral-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="h-12 w-12 text-neutral-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-800 mb-2">No applications yet</h2>
                            <p className="text-lg text-neutral-500 mb-8 max-w-md mx-auto">
                                You haven't applied to any roles yet. Start your journey by exploring our open positions.
                            </p>
                            <Link href="/candidate/jobs">
                                <Button className={`h-14 px-8 text-lg ${CUSTOM_GREEN_BG} hover:bg-[#a3bd5b] text-neutral-900 font-bold`}>
                                    Browse Open Positions
                                    <ExternalLink className="h-5 w-5 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 text-center text-neutral-600">
                            <p className="text-lg">No applications found matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        filteredApplications.map((app) => {
                            const status = statusConfig[app.status] || statusConfig.Applied;
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={app.id}
                                    className="bg-white rounded-2xl p-8 shadow-lg border border-neutral-100 hover:shadow-xl hover:border-[#b9d36c]/30 transition-all duration-300 group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-neutral-800 group-hover:text-[#b9d36c] transition-colors mb-2">
                                                        <Link href={`/candidate/jobs/${app.job_id}`}>
                                                            {app.job_title || "Job Position"}
                                                        </Link>
                                                    </h3>
                                                    <div className="flex flex-wrap gap-4 text-neutral-500">
                                                        <span className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1 rounded-full text-sm font-medium">
                                                            <MapPin className="h-4 w-4 text-[#b9d36c]" />
                                                            {app.city || app.location || "Remote"}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1 rounded-full text-sm font-medium">
                                                            <Building2 className="h-4 w-4 text-[#b9d36c]" />
                                                            Buch International Hospital
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Mobile Status Badge (visible only on small screens) */}
                                                <div className={`md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${status.bg} ${status.border} ${status.color}`}>
                                                    <StatusIcon className="h-4 w-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">{status.label}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-sm text-neutral-400 font-medium">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Applied on {formatDate(app.applied_at)}
                                            </div>
                                        </div>

                                        {/* Desktop Status Badge & Action */}
                                        <div className="flex flex-col items-end gap-4">
                                            <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full border ${status.bg} ${status.border} ${status.color}`}>
                                                <StatusIcon className="h-5 w-5" />
                                                <span className="text-sm font-bold uppercase tracking-wider">{status.label}</span>
                                            </div>

                                            <Link href={`/candidate/jobs/${app.job_id}`}>
                                                <Button variant="ghost" className="text-neutral-400 hover:text-[#b9d36c] hover:bg-[#b9d36c]/5">
                                                    View Job Details <ExternalLink className="h-4 w-4 ml-2" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
