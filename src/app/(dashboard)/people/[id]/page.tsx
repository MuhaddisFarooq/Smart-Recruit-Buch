
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    User, Phone, MapPin, Mail, Calendar, Building2, GraduationCap,
    FileText, ArrowLeft, MoreHorizontal, Download, Edit
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

// --- Types ---

type Experience = {
    title: string;
    company: string;
    location: string;
    description: string;
    start_date: string;
    end_date: string;
    is_current: boolean | number;
};

type Education = {
    institution: string;
    major: string;
    degree: string;
    location: string;
    description: string;
    start_date: string;
    end_date: string;
    is_current: boolean | number;
};

type CandidateProfile = {
    application_id: number;
    user_id: number;
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    current_title: string;
    current_company: string;
    applied_at: string;
    status: string;
    resume_url: string;
    job_id: number;
    job_title: string;
    job_status: string;
    experience_list?: Experience[];
    education_list?: Education[];
};

import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import MoveToJobDialog from "@/components/jobs/MoveToJobDialog";

// ... Types ...

export default function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"profile" | "resume">("profile");
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

    useEffect(() => {
        fetchCandidate();
    }, [resolvedParams.id]);

    const fetchCandidate = async () => {
        try {
            const res = await fetch(`/api/job-applications/${resolvedParams.id}`);
            if (res.ok) {
                const data = await res.json();
                setCandidate(data);
            } else {
                toast.error("Failed to load candidate profile");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!candidate) return;
        try {
            const res = await fetch(`/api/job-applications/${candidate.application_id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                toast.success(`Status updated to ${newStatus}`);
                setCandidate(prev => prev ? { ...prev, status: newStatus } : null);
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDeleteApplication = async () => {
        if (!candidate || !confirm("Are you sure you want to remove this job application? this cannot be undone.")) return;
        try {
            const res = await fetch(`/api/job-applications/${candidate.application_id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Application removed");
                router.push("/jobs");
            } else {
                toast.error("Failed to remove application");
            }
        } catch (e) {
            toast.error("Error removing application");
        }
    };

    const handleDeleteCandidate = async () => {
        if (!candidate || !confirm("Are you sure you want to permenantly delete this candidate and all their applications?")) return;
        try {
            const res = await fetch(`/api/people/${candidate.user_id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Candidate deleted");
                router.push("/jobs");
            } else {
                toast.error("Failed to delete candidate");
            }
        } catch (e) {
            toast.error("Error deleting candidate");
        }
    };

    const formatDateRange = (start: string | null, end: string | null, isCurrent: boolean | number) => {
        if (!start) return "";
        const startDate = new Date(start).toLocaleDateString("en-US", { month: "short", year: "numeric" });
        if (isCurrent) return `${startDate} - Present`;
        if (!end) return startDate;
        const endDate = new Date(end).toLocaleDateString("en-US", { month: "short", year: "numeric" });
        return `${startDate} - ${endDate}`;
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="animate-spin h-8 w-8 border-2 border-green-600 rounded-full border-t-transparent"></div>
        </div>
    );

    if (!candidate) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-500">
            <User className="h-12 w-12 mb-4 opacity-20" />
            <h2 className="text-xl font-semibold">Candidate not found</h2>
            <Button variant="link" onClick={() => router.back()}>Go back</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-[1400px] mx-auto px-6 py-6">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-5">
                            <Avatar className="h-16 w-16 bg-purple-600 text-white text-xl font-medium border-2 border-white shadow-sm ring-1 ring-gray-100">
                                <AvatarFallback className="bg-purple-600">
                                    {candidate.name ? candidate.name.substring(0, 2).toUpperCase() : "NA"}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{candidate.name}</h1>
                                <p className="text-gray-600">
                                    {candidate.experience_list && candidate.experience_list.length > 0
                                        ? `${candidate.experience_list[0].title} at ${candidate.experience_list[0].company}`
                                        : (candidate.current_title ? `${candidate.current_title} ${candidate.current_company ? `at ${candidate.current_company}` : ''}` : "Candidate")
                                    }
                                </p>

                                <div className="flex items-center gap-4 text-sm text-gray-500 pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                        {candidate.city}, {candidate.country}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                                        {candidate.phone || "No phone"}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                        <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">{candidate.email}</a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Navigation Tabs (Header Level) */}
                    <div className="flex items-center gap-8 mt-8 border-b border-gray-100 -mb-6 px-1">
                        {['Overview', 'Communication', 'Reviews', 'Interviews', 'Notes', 'Screening'].map((tab) => (
                            <div
                                key={tab}
                                className={`pb-4 text-sm font-semibold cursor-pointer border-b-2 transition-colors ${tab === 'Overview'
                                    ? 'border-green-600 text-green-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                                {tab === 'Communication' && <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">1</span>}
                            </div>
                        ))}
                        <div className="pb-4 text-sm font-semibold cursor-pointer border-b-2 border-transparent text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            More <div className="text-xs">▼</div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 flex gap-8 items-start">

                {/* Main Content Area (Left) */}
                <div className="flex-1 min-w-0 space-y-6">

                    {/* Toggle: Profile / Resume */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant={viewMode === 'profile' ? 'default' : 'outline'}
                            onClick={() => setViewMode('profile')}
                            className={`gap-2 ${viewMode === 'profile' ? 'bg-[#167f39] hover:bg-[#12662d] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            <User className="h-4 w-4" /> Profile
                        </Button>
                        <Button
                            variant={viewMode === 'resume' ? 'default' : 'outline'}
                            onClick={() => setViewMode('resume')}
                            className={`gap-2 ${viewMode === 'resume' ? 'bg-[#167f39] hover:bg-[#12662d] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            <FileText className="h-4 w-4" /> Resume
                        </Button>
                    </div>

                    {viewMode === 'profile' ? (
                        <>
                            {/* Experience Card */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-base font-semibold text-gray-900">Experience</h3>
                                    <Button variant="ghost" size="sm" className="text-green-700 hover:bg-green-50 text-xs font-semibold uppercase">Add</Button>
                                </div>

                                <div className="space-y-8">
                                    {candidate.experience_list && candidate.experience_list.length > 0 ? (
                                        candidate.experience_list.map((exp, i) => (
                                            <div key={i} className="flex gap-4 group">
                                                <div className="mt-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-gray-300 ring-4 ring-white"></div>
                                                    {i !== candidate.experience_list!.length - 1 && (
                                                        <div className="w-0.5 h-full bg-gray-100 mx-auto mt-2"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-900">{exp.title}</h4>
                                                            <div className="text-sm text-gray-600 mt-0.5">{exp.company}</div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1 mb-2">
                                                        {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                                                    </div>
                                                    {exp.description && (
                                                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-400 italic">No experience added</div>
                                    )}
                                </div>
                            </div>

                            {/* Education Card */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-base font-semibold text-gray-900">Education</h3>
                                    <Button variant="ghost" size="sm" className="text-green-700 hover:bg-green-50 text-xs font-semibold uppercase">Add</Button>
                                </div>

                                <div className="space-y-8">
                                    {candidate.education_list && candidate.education_list.length > 0 ? (
                                        candidate.education_list.map((edu, i) => (
                                            <div key={i} className="flex gap-4 group">
                                                <div className="mt-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-gray-300 ring-4 ring-white"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-900">{edu.institution}</h4>
                                                            <div className="text-sm text-gray-600 mt-0.5">{edu.degree} {edu.major ? `in ${edu.major}` : ''}</div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1 mb-2">
                                                        {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-400 italic">None specified</div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Resume View */
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden min-h-[800px]">
                            {candidate.resume_url ? (
                                <iframe
                                    src={`${viewMode === 'resume' && (candidate.resume_url.endsWith('bin') || candidate.resume_url.includes('upload'))
                                        ? `/api/view-pdf?url=${encodeURIComponent(candidate.resume_url)}`
                                        : candidate.resume_url}#toolbar=0&navpanes=0&view=FitH`}
                                    className="w-full h-[800px] border-none"
                                    title="Resume"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                                    <FileText className="h-12 w-12 mb-3 opacity-20" />
                                    <p>No resume file available</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar (Right) */}
                <aside className="w-[360px] flex-shrink-0 space-y-6">

                    {/* Status Card */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                        <div className="flex justify-between items-start mb-4">
                            <Badge variant="secondary" className="bg-[#1e40af] text-white hover:bg-[#1e40af] text-xs font-semibold px-2 py-0.5 rounded-sm">
                                Applicant profile
                            </Badge>
                            <User className="h-4 w-4 text-gray-400" />
                        </div>

                        <h3 className="font-bold text-gray-900 text-base mb-1">{candidate.job_title}</h3>

                        <div className="flex gap-0.5 text-gray-300 mb-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <span key={i} className="text-lg leading-none cursor-pointer hover:text-yellow-400">☆</span>
                            ))}
                        </div>

                        <div className="text-xs text-gray-500 space-y-1 mb-6">
                            <p>{candidate.city}, {candidate.country} <span className="text-gray-300">|</span> REF161M <span className="text-gray-300">|</span> <Link href={`/jobs/${candidate.job_id}`} className="text-blue-600 hover:underline">Job link ↗</Link></p>
                            <p>From Default Career Page • {new Date(candidate.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>

                        {/* Progress Bar (Visual Only) */}
                        <div className="relative mb-6">
                            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                                <span className={['new', 'reviewed', 'shortlisted'].includes(candidate.status) ? 'text-green-700' : ''}>New</span>
                                <span className={['interview'].includes(candidate.status) ? 'text-green-700' : ''}>In Review</span>
                                <span className={['offered'].includes(candidate.status) ? 'text-green-700' : ''}>Interview</span>
                                <span className={['hired'].includes(candidate.status) ? 'text-green-700' : ''}>Offered</span>
                                <span className={['hired'].includes(candidate.status) ? 'text-green-700' : ''}>Hired</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-green-500 rounded-full ${candidate.status === 'new' ? 'w-[5%]' :
                                    candidate.status === 'reviewed' ? 'w-[25%]' :
                                        candidate.status === 'interview' ? 'w-[50%]' :
                                            candidate.status === 'offered' ? 'w-[75%]' :
                                                candidate.status === 'hired' ? 'w-full' : 'w-0'
                                    }`}></div>
                            </div>
                        </div>

                        {/* Actions */}
                        {/* Actions */}
                        <div className="flex gap-2">
                            <div className="flex gap-[1px] flex-1">
                                <Button
                                    className="flex-1 bg-[#167f39] hover:bg-[#12662d] text-white font-bold rounded-r-none h-9"
                                    onClick={() => handleStatusChange('reviewed')}
                                >
                                    Move forward
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="bg-[#167f39] hover:bg-[#12662d] text-white px-2 rounded-l-none h-9">
                                            <span className="text-xs">▼</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <div className="p-2 space-y-1">
                                            {['new', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired'].map((status) => (
                                                <div
                                                    key={status}
                                                    className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer capitalize"
                                                    onClick={() => handleStatusChange(status)}
                                                >
                                                    {{
                                                        'new': 'New',
                                                        'reviewed': 'In-Review',
                                                        'shortlisted': 'Short-Listed',
                                                        'interview': 'Interview',
                                                        'offered': 'Offered',
                                                        'hired': 'Hired'
                                                    }[status] || status.replace('-', ' ')}
                                                    {candidate.status === status && <span className="text-green-600 font-bold">✓</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <Button variant="outline" className="flex-1 border-green-600 text-green-700 hover:bg-green-50 font-bold h-9 bg-white" onClick={() => handleStatusChange('rejected')}>
                                Reject
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="border-green-600 text-green-700 hover:bg-green-50 w-9 h-9 shrink-0 bg-white">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => handleStatusChange(candidate.status === 'withdrawn' ? 'reviewed' : 'withdrawn')}>
                                        {candidate.status === 'withdrawn' ? 'Undo withdrawn' : 'Mark as withdrawn'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsMoveDialogOpen(true)}>
                                        Add to another job
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteApplication()}>
                                        Remove from this job
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toast.success("Badge added")}>
                                        Add employee badge
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCandidate()}>
                                        Delete candidate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteApplication()}>
                                        Delete job application
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Dialogs */}
                        <MoveToJobDialog
                            isOpen={isMoveDialogOpen}
                            onClose={() => setIsMoveDialogOpen(false)}
                            currentJobId={candidate.job_id}
                            applicationId={candidate.application_id}
                            onSuccess={() => {
                                fetchCandidate();
                                router.push(`/jobs`); // Or refresh page to see new job link
                            }}
                        />

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded">
                                <span className="text-gray-400">↳</span> Linked job applications
                            </div>
                        </div>
                    </div>

                    {/* Meta Cards */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h4 className="font-medium text-gray-700">Consent status</h4>
                            <span className="text-gray-400 text-xs">🔒</span>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                You cannot request consent from this candidate as no privacy policy has been configured. Please contact your administrator.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-orange-600 font-medium bg-orange-50 p-2 rounded border border-orange-100">
                                <span>⚠️</span> Consent required
                            </div>
                        </div>
                    </div>



                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-4 flex justify-between items-center">
                            <h4 className="font-medium text-gray-700">Attachments</h4>
                            <div className="relative">
                                <span
                                    className="text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-green-700"
                                    onClick={() => document.getElementById('resume-upload')?.click()}
                                >
                                    Add
                                </span>
                                <input
                                    type="file"
                                    id="resume-upload"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const formData = new FormData();
                                        formData.append('file', file);

                                        const toastId = toast.loading("Uploading resume...");

                                        try {
                                            const res = await fetch(`/api/job-applications/${candidate.application_id}/resume`, {
                                                method: 'POST',
                                                body: formData
                                            });

                                            if (res.ok) {
                                                const data = await res.json();
                                                toast.success("Resume updated", { id: toastId });
                                                setCandidate(prev => prev ? ({ ...prev, resume_url: data.url }) : null);
                                            } else {
                                                throw new Error("Upload failed");
                                            }
                                        } catch (error) {
                                            toast.error("Failed to upload resume", { id: toastId });
                                        }
                                        // Reset input
                                        e.target.value = '';
                                    }}
                                />
                            </div>
                        </div>
                        {candidate.resume_url && (
                            <div className="px-4 pb-4">
                                <div
                                    className="flex items-center gap-3 text-sm text-blue-600 hover:underline cursor-pointer group"
                                    onClick={() => window.open(candidate.resume_url, '_blank')}
                                >
                                    <User className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                                    Resume
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4 text-gray-300 ml-auto hover:text-gray-600" />
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(candidate.resume_url, '_blank');
                                            }}>
                                                Download
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={(e) => {
                                                e.stopPropagation();
                                                toast.info("Delete not implemented yet");
                                            }}>
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}
                    </div>




                </aside>
            </main>
        </div>
    );
}

