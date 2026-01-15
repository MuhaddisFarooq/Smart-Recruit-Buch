"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, MapPin, Clock, ExternalLink, CheckCircle, XCircle, AlertCircle, Building2, Calendar, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
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
    interview_date?: string;
    offer_letter_url?: string;
    signed_offer_letter_url?: string;
    appointment_letter_url?: string;
    signed_appointment_letter_url?: string;
};



{/* Desktop Status Badge & Action */ }
const statusConfig: { [key: string]: { color: string; bg: string; border: string; icon: any; label: string } } = {
    Applied: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: AlertCircle, label: "Applied" },
    new: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: AlertCircle, label: "Under Review" },
    reviewed: { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", icon: AlertCircle, label: "Reviewed" },
    shortlisted: { color: "text-[#b9d36c]", bg: "bg-[#b9d36c]/10", border: "border-[#b9d36c]/20", icon: CheckCircle, label: "Shortlisted" },
    interview: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", icon: AlertCircle, label: "Interview" },
    offered: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: CheckCircle, label: "Offered" },
    hired: { color: "text-green-700", bg: "bg-green-100", border: "border-green-200", icon: CheckCircle, label: "Hired" },
    rejected: { color: "text-red-600", bg: "bg-red-50", border: "border-red-100", icon: XCircle, label: "Not Selected" },
    withdrawn: { color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", icon: XCircle, label: "Withdrawn" },
    selected: { color: "text-[#b9d36c]", bg: "bg-[#b9d36c]/10", border: "border-[#b9d36c]/20", icon: CheckCircle, label: "Selected" },
};

const CUSTOM_GREEN = "text-[#b9d36c]";
const CUSTOM_GREEN_BG = "bg-[#b9d36c]";
const CUSTOM_GREEN_BORDER = "border-[#b9d36c]";

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<{ [key: number]: File }>({});
    const [submitting, setSubmitting] = useState<{ [key: number]: boolean }>({});

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

    const handleFileSelect = (appId: number, file: File) => {
        setSelectedFiles(prev => ({ ...prev, [appId]: file }));
    };

    const handleSubmitSignedOffer = async (appId: number) => {
        const file = selectedFiles[appId];
        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setSubmitting(prev => ({ ...prev, [appId]: true }));
        try {
            const res = await fetch(`/api/job-applications/${appId}/upload-offer`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                toast.success("Signed offer submitted successfully!");
                // Clear selection
                setSelectedFiles(prev => {
                    const newState = { ...prev };
                    delete newState[appId];
                    return newState;
                });
                // Refresh to update status and hide form
                fetchApplications();
            } else {
                toast.error("Failed to submit");
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload error");
        } finally {
            setSubmitting(prev => ({ ...prev, [appId]: false }));
        }
    };

    const handleSubmitSignedAppointment = async (appId: number) => {
        const file = selectedFiles[appId];
        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setSubmitting(prev => ({ ...prev, [appId]: true }));
        try {
            const res = await fetch(`/api/job-applications/${appId}/upload-appointment`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                toast.success("Signed appointment letter submitted successfully!");
                // Clear selection
                setSelectedFiles(prev => {
                    const newState = { ...prev };
                    delete newState[appId];
                    return newState;
                });
                // Refresh to update status and hide form
                fetchApplications();
            } else {
                toast.error("Failed to submit");
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload error");
        } finally {
            setSubmitting(prev => ({ ...prev, [appId]: false }));
        }
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

                                            {app.interview_date && (
                                                <div className="mt-2 flex items-center text-sm text-orange-600 font-medium bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 w-fit">
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    Interview: {new Date(app.interview_date).toLocaleString()}
                                                </div>
                                            )}

                                            {app.status === 'offered' && (
                                                <div className="mt-4 p-5 bg-emerald-50 rounded-xl border border-emerald-100 w-full md:max-w-md">
                                                    <h4 className="font-semibold text-emerald-800 mb-4 flex items-center text-lg">
                                                        <CheckCircle className="h-5 w-5 mr-2" />
                                                        Congratulations! You have an offer.
                                                    </h4>

                                                    {app.signed_offer_letter_url ? (
                                                        <div className="bg-white/80 p-4 rounded-lg border border-emerald-100/50 text-center">
                                                            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600">
                                                                <CheckCircle className="h-6 w-6" />
                                                            </div>
                                                            <p className="text-emerald-800 font-semibold mb-1">Signed Offer Submitted</p>
                                                            <p className="text-emerald-600 text-sm">Thank you for accepting the offer!</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-4">
                                                            {app.offer_letter_url && (
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full justify-start bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100 h-10"
                                                                    onClick={() => window.open(app.offer_letter_url, '_blank')}
                                                                >
                                                                    <FileText className="h-4 w-4 mr-2" /> Download Offer Letter
                                                                </Button>
                                                            )}

                                                            <div className="space-y-2 pt-2 border-t border-emerald-100">
                                                                <label className="text-xs font-bold text-emerald-700 uppercase tracking-wide block">
                                                                    Upload Signed Copy to Accept
                                                                </label>
                                                                <div className="flex gap-2">
                                                                    <div className="relative flex-1">
                                                                        <Input
                                                                            type="file"
                                                                            accept=".pdf,.docx,.doc"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) handleFileSelect(app.id, file);
                                                                            }}
                                                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                                                        />
                                                                        <div className="bg-white border text-emerald-700 border-emerald-200 rounded-lg px-3 py-2 text-sm truncate flex items-center h-10">
                                                                            {selectedFiles[app.id] ? (
                                                                                <span className="text-neutral-900 font-medium truncate">{selectedFiles[app.id].name}</span>
                                                                            ) : (
                                                                                <span className="text-neutral-400">Choose file...</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        onClick={() => handleSubmitSignedOffer(app.id)}
                                                                        disabled={!selectedFiles[app.id] || submitting[app.id]}
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4"
                                                                    >
                                                                        {submitting[app.id] ? "..." : "Submit"}
                                                                    </Button>
                                                                </div>
                                                                <p className="text-[10px] text-emerald-600/80">
                                                                    Please download, sign, scan and upload the document.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {app.status === 'hired' && (
                                                <div className="mt-4 p-5 bg-green-50 rounded-xl border border-green-100 w-full md:max-w-md">
                                                    <h4 className="font-semibold text-green-800 mb-4 flex items-center text-lg">
                                                        <CheckCircle className="h-5 w-5 mr-2" />
                                                        You are Hired!
                                                    </h4>

                                                    {app.signed_appointment_letter_url ? (
                                                        <div className="bg-white/80 p-4 rounded-lg border border-green-100/50 text-center">
                                                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
                                                                <CheckCircle className="h-6 w-6" />
                                                            </div>
                                                            <p className="text-green-800 font-semibold mb-1">Signed Appointment Submitted</p>
                                                            <p className="text-green-600 text-sm">Welcome to the team!</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-4">
                                                            {app.appointment_letter_url ? (
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full justify-start bg-white border-green-200 text-green-700 hover:bg-green-100 h-10"
                                                                    onClick={() => window.open(app.appointment_letter_url, '_blank')}
                                                                >
                                                                    <FileText className="h-4 w-4 mr-2" /> Download Appointment Letter
                                                                </Button>
                                                            ) : (
                                                                <p className="text-sm text-green-600 italic">Appointment letter will be generated soon.</p>
                                                            )}

                                                            {app.appointment_letter_url && (
                                                                <div className="space-y-2 pt-2 border-t border-green-100">
                                                                    <label className="text-xs font-bold text-green-700 uppercase tracking-wide block">
                                                                        Upload Signed Appointment Letter
                                                                    </label>
                                                                    <div className="flex gap-2">
                                                                        <div className="relative flex-1">
                                                                            <Input
                                                                                type="file"
                                                                                accept=".pdf,.docx,.doc"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) handleFileSelect(app.id, file);
                                                                                }}
                                                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                                                            />
                                                                            <div className="bg-white border text-green-700 border-green-200 rounded-lg px-3 py-2 text-sm truncate flex items-center h-10">
                                                                                {selectedFiles[app.id] ? (
                                                                                    <span className="text-neutral-900 font-medium truncate">{selectedFiles[app.id].name}</span>
                                                                                ) : (
                                                                                    <span className="text-neutral-400">Choose file...</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            onClick={() => handleSubmitSignedAppointment(app.id)}
                                                                            disabled={!selectedFiles[app.id] || submitting[app.id]}
                                                                            className="bg-green-600 hover:bg-green-700 text-white font-bold h-10 px-4"
                                                                        >
                                                                            {submitting[app.id] ? "..." : "Submit"}
                                                                        </Button>
                                                                    </div>
                                                                    <p className="text-[10px] text-green-600/80">
                                                                        Please download, sign, scan and upload the document.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
