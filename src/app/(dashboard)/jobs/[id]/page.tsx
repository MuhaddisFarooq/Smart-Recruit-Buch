"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    MoreHorizontal,
    ArrowLeft,
    ChevronDown,
    Link as LinkIcon,
    Columns,
    Search,
    MapPin,
    Building2,
    Calendar,
    Briefcase,
    Scan,
    User,
    Info
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CandidateProfileDrawer from "@/components/jobs/CandidateProfileDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AddCandidateDialog from "@/components/jobs/AddCandidateDialog";

// --- Types ---

type JobData = {
    id: number;
    job_title: string;
    location: string;
    city: string;
    country: string;
    department: string;
    status: string;
    status_label?: string; // e.g. "Public"
    addedDate: string;
    // Counters
    new_count: number;
    in_review_count: number;
    interview_count: number;
    offered_count: number;
    hired_count: number;
    all_active_count: number;
    withdrawn_count: number;
    rejected_count: number;
    // Job Details
    job_function: string;
    type_of_employment: string;
    company_description: string;
    description: string;
    qualifications: string;
    additional_information: string;
    // Extended fields
    industry?: string;
    salary_from?: string;
    salary_to?: string;
    currency?: string;
    salary_period?: string;
    target_hiring_date?: string;
    internal_notes?: string;
    attachments?: string; // JSON string
    experience_level?: string;
};

type Application = {
    application_id: number;
    user_id: number;
    status: string; // new, reviewed, interview, offered, hired, rejected, withdrawn
    applied_at: string;
    resume_url: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    current_title: string;
    current_company: string;
    experience_list?: any[]; // Keep as any for now or create shared type
    education_list?: any[];
};

// --- Components ---

const StatusCounterCard = ({ label, count, active = false }: { label: string, count: number, active?: boolean }) => (
    <div className={`
        flex flex-col items-center justify-center p-3 rounded-lg border min-w-[100px] h-[72px] cursor-pointer transition-all
        ${active ? 'bg-white border-green-500 shadow-sm ring-1 ring-green-500' : 'bg-white border-gray-200 hover:border-gray-300'}
    `}>
        <span className="text-lg font-bold text-gray-800">{count}</span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{label}</span>
    </div>
);

const ApplicantRow = ({ app, onStatusChange, onDelete, onView }: { app: Application, onStatusChange: (id: number, status: string) => void, onDelete: (id: number) => void, onView: (app: Application) => void }) => {
    return (
        <div className="flex items-center py-4 px-4 hover:bg-gray-50 border-b border-gray-100 group transition-colors">
            {/* Checkbox Placeholder */}
            <div className="mr-4">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-3 w-[25%]">
                <Avatar className="h-10 w-10 bg-purple-600 text-white">
                    <AvatarFallback className="bg-purple-600">
                        {app.name ? app.name.substring(0, 2).toUpperCase() : "NA"}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{app.name}</div>
                    <div className="text-sm text-gray-500 truncate">{app.current_title || "Candidate"}</div>
                </div>
            </div>

            {/* Actions Menu (Replacing "Sourcing" icon area from screenshot) */}
            <div className="w-[5%] flex justify-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                    onClick={() => onView(app)}
                    title="View Profile"
                >
                    <Scan className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem onClick={() => onStatusChange(app.application_id, 'rejected')}>
                            Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(app.application_id, 'hired')}>
                            Hire
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(app.application_id, 'withdrawn')}>
                            Mark as withdrawn
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(app.application_id, 'interview')}>
                            Invite to interview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>
                            Invite to self-schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>
                            Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>
                            Send message
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>
                            Add to job
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>
                            Request consent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>
                            Add employee badge
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(app.application_id)}>
                            Remove from this job
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => toast.info("Deleting candidate profile is restricted")}>
                            Delete candidate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(app.application_id)}>
                            Delete job application
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>


            {/* Company */}
            <div className="w-[20%] text-sm text-gray-700 truncate px-2">
                {app.current_company || "-"}
            </div>

            {/* Location */}
            <div className="w-[15%] text-sm text-gray-500 truncate px-2">
                <div className="flex flex-col">
                    <span className="text-gray-900">{app.city || "Unknown"}</span>
                    <span className="text-xs">{app.country || ""}</span>
                </div>
            </div>

            {/* Status */}
            <div className="w-[15%] px-2">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 capitalize">{app.status.replace('-', ' ')}</span>
                    <span className="text-xs text-gray-500">{new Date(app.applied_at).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Rating (Placeholder) */}
            <div className="w-[10%] flex justify-end px-2">
                <div className="flex gap-0.5 text-gray-300">
                    {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className="text-lg leading-none cursor-pointer hover:text-yellow-400">☆</span>
                    ))}
                </div>
            </div>

            {/* Application Date */}
            <div className="w-[10%] text-sm text-gray-500 text-right px-2">
                {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
        </div>
    );
};


// --- Page Component ---

export default function JobManagementPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [job, setJob] = useState<JobData | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
    const [internalNotes, setInternalNotes] = useState("");
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    const fetchJobData = async () => {
        try {
            // Fetch Job Details (with counters)
            const resJob = await fetch(`/api/jobs/${resolvedParams.id}`);
            if (!resJob.ok) throw new Error("Job not found");
            const jobData = await resJob.json();
            setJob(jobData);
            setInternalNotes(jobData.internal_notes || "");

            // Fetch Applicants
            const resApps = await fetch(`/api/jobs/${resolvedParams.id}/applications`);
            if (resApps.ok) {
                const appsData = await resApps.json();
                setApplications(appsData);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load job data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobData();
    }, [resolvedParams.id]);

    const handleStatusChange = async (appId: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/job-applications/${appId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                toast.success(`Candidate moved to ${newStatus}`);
                fetchJobData(); // Refresh counts and list
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDeleteApplication = async (appId: number) => {
        if (!confirm("Are you sure you want to delete this application? This cannot be undone.")) return;

        try {
            const res = await fetch(`/api/job-applications/${appId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Application deleted");
                fetchJobData();
            } else {
                toast.error("Failed to delete application");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-green-600 rounded-full border-t-transparent"></div></div>;
    }

    if (!job) return <div className="p-8">Job not found</div>;

    const filteredApplications = applications.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-gray-50 min-h-screen pb-12">

            {/* Top Header Card */}
            <div className="bg-white border-b border-gray-200 px-6 py-5">
                <div className="max-w-[1400px] mx-auto">
                    {/* Title Row */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.job_title}</h1>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className={`flex items-center gap-1.5 ${['active', 'published', 'public', 'open'].includes(job.status.toLowerCase()) ? 'text-green-600' : 'text-gray-500'}`}>
                                    <span className={`w-2 h-2 rounded-full ${['active', 'published', 'public', 'open'].includes(job.status.toLowerCase()) ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                                    {['active', 'published', 'public', 'open'].includes(job.status.toLowerCase()) ? 'Published' : 'Draft'} <ChevronDown className="w-3 h-3" />
                                </span>
                                <span>Public</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                <span>{job.city}, {job.country}</span>
                                <span>•</span>
                                <span>Created: {new Date(job.addedDate).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="uppercase text-gray-500">REF{job.id}M</span>
                                <span>•</span>
                                <a href={`/candidate/jobs/${job.id}`} target="_blank" className="text-blue-500 hover:underline flex items-center gap-1">
                                    View Live <LinkIcon className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50" onClick={() => setIsAddCandidateOpen(true)}>
                                Add candidate
                            </Button>
                            <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                                Advertise
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="border-green-600 text-green-700 hover:bg-green-50">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}/edit`)}>
                                        Edit job ad
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={async () => {
                                        const isPublished = ['active', 'published', 'public', 'open'].includes(job.status.toLowerCase());
                                        const action = isPublished ? "unpublish" : "publish";
                                        const newStatus = isPublished ? "draft" : "active";

                                        if (confirm(`Are you sure you want to ${action} this job?`)) {
                                            try {
                                                const res = await fetch(`/api/jobs/${job.id}`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ status: newStatus })
                                                });
                                                if (res.ok) {
                                                    toast.success(`Job ${isPublished ? "unpublished" : "published"} successfully`);
                                                    fetchJobData();
                                                } else {
                                                    toast.error(`Failed to ${action} job`);
                                                }
                                            } catch (e) {
                                                toast.error("An error occurred");
                                            }
                                        }
                                    }}>
                                        {['active', 'published', 'public', 'open'].includes(job.status.toLowerCase()) ? "Unpublish job" : "Publish job"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={async () => {
                                        if (confirm("Are you sure you want to cancel (delete) this job? This cannot be undone.")) {
                                            try {
                                                const res = await fetch(`/api/jobs/${job.id}`, {
                                                    method: "DELETE",
                                                });
                                                if (res.ok) {
                                                    toast.success("Job cancelled successfully");
                                                    router.push("/jobs");
                                                } else {
                                                    toast.error("Failed to cancel job");
                                                }
                                            } catch (e) {
                                                toast.error("An error occurred");
                                            }
                                        }
                                    }}>
                                        Cancel job
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Pipeline Counters */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                        <StatusCounterCard label="New" count={job.new_count || 0} active />
                        <StatusCounterCard label="In-review" count={job.in_review_count || 0} />
                        <StatusCounterCard label="Interview" count={job.interview_count || 0} />
                        <StatusCounterCard label="Offered" count={job.offered_count || 0} />
                        <StatusCounterCard label="Hired" count={job.hired_count || 0} />
                        {/* Spacer or Divider */}
                        <div className="w-px bg-gray-200 mx-1 h-[72px]"></div>
                        <StatusCounterCard label="All Active" count={job.all_active_count || 0} />
                        <StatusCounterCard label="Withdrawn" count={job.withdrawn_count || 0} />
                        <StatusCounterCard label="Rejected" count={job.rejected_count || 0} />
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="max-w-[1400px] mx-auto px-6 mt-6">
                <Tabs defaultValue="applicants" className="w-full">
                    <TabsList className="bg-transparent h-auto p-0 border-b border-gray-200 w-full justify-start rounded-none gap-8">
                        <TabsTrigger
                            value="applicants"
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-gray-900 text-gray-500 rounded-none px-0 pb-3 text-sm font-semibold hover:text-gray-700"
                        >
                            Applicants
                        </TabsTrigger>
                        <TabsTrigger
                            value="activity"
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-gray-900 text-gray-500 rounded-none px-0 pb-3 text-sm font-semibold hover:text-gray-700"
                        >
                            Activity
                        </TabsTrigger>
                        <TabsTrigger
                            value="job_ad"
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-gray-900 text-gray-500 rounded-none px-0 pb-3 text-sm font-semibold hover:text-gray-700"
                        >
                            Job ad
                        </TabsTrigger>
                        <TabsTrigger
                            value="job_details"
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-gray-900 text-gray-500 rounded-none px-0 pb-3 text-sm font-semibold hover:text-gray-700"
                        >
                            Job details
                        </TabsTrigger>

                        <TabsTrigger value="hiring_process" disabled className="text-gray-400">Hiring process</TabsTrigger>
                    </TabsList>

                    <TabsContent value="applicants" className="mt-6">
                        {/* Filters Bar */}
                        <div className="mb-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-10 h-10 border-gray-300 bg-white"
                                    placeholder="Search by name, email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-600 h-8 text-xs font-medium">Status</Button>
                                <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-600 h-8 text-xs font-medium">Rating</Button>
                                <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-600 h-8 text-xs font-medium">Screening questions</Button>
                                <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-600 h-8 text-xs font-medium">Location</Button>
                                <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-600 h-8 text-xs font-medium">Proximity</Button>
                                <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-600 h-8 text-xs font-medium">Source</Button>
                                <Button variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-600 h-8 text-xs font-medium">More</Button>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <p className="text-sm text-gray-500">Showing {filteredApplications.length} of {applications.length} applicants</p>
                                <div className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <Columns className="h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        {/* Applicants Table */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
                            {/* Table Header */}
                            <div className="flex items-center bg-white border-b border-gray-200 py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <div className="mr-4"><input type="checkbox" className="w-4 h-4 rounded border-gray-300" /></div>
                                <div className="w-[25%]">Applicant</div>
                                <div className="w-[5%]"></div> {/* Actions placeholder */}
                                <div className="w-[20%] px-2">Company</div>
                                <div className="w-[15%] px-2">Location</div>
                                <div className="w-[15%] px-2">Status</div>
                                <div className="w-[10%] px-2 text-right">Rating</div>
                                <div className="w-[10%] px-2 text-right">Application date</div>
                            </div>

                            {/* Table Body */}
                            <div>
                                {filteredApplications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <div className="bg-gray-50 p-4 rounded-full mb-3">
                                            <Search className="h-6 w-6" />
                                        </div>
                                        <p>No applicants found.</p>
                                    </div>
                                ) : (
                                    filteredApplications.map(app => (
                                        <ApplicantRow
                                            key={app.application_id}
                                            app={app}
                                            onStatusChange={handleStatusChange}
                                            onDelete={handleDeleteApplication}
                                            onView={(candidate) => {
                                                setSelectedCandidate(candidate);
                                                setDrawerOpen(true);
                                            }}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="activity" className="mt-6">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-[400px] p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-6 px-2">Activity Stream</h3>

                            <div className="space-y-6">
                                {applications.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">No activity yet.</div>
                                ) : (
                                    applications
                                        .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
                                        .map((app) => (
                                            <div key={app.application_id} className="flex gap-4 pb-6 border-b border-gray-100 last:border-0 px-2 group">
                                                <Avatar className="h-10 w-10 bg-gray-100 text-gray-500 border border-gray-200">
                                                    <AvatarFallback>
                                                        <User className="h-5 w-5" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="text-sm text-gray-900">
                                                        <span className="font-semibold text-gray-900">{app.name}</span> expressed interest in <span className="font-semibold text-gray-900">{job.job_title}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                                                    </div>

                                                    {/* Optional: Add avatars if we were grouping, for now just individual items */}
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="job_ad" className="mt-6">
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 max-w-3xl">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-semibold text-gray-900">{job.job_title}</h2>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded border border-gray-200">Default</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={() => router.push(`/jobs/${job.id}/edit`)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}/edit`)}>Edit job ad</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="text-sm text-gray-500 mb-6 flex items-center flex-wrap gap-1">
                                <span>{job.location || "No location"}, {job.city}, {job.country}</span>
                                <span className="mx-1">•</span>
                                <a href={`/candidate/jobs/${job.id}`} target="_blank" className="text-blue-600 hover:underline">
                                    https://smrtr.io/wn59H (View Live)
                                </a>
                                <span className="mx-1">•</span>
                                <a href="#" className="text-blue-600 hover:underline">
                                    Screening Questions
                                </a>
                            </div>

                            <div className="bg-gray-50 rounded border border-gray-100 p-3 flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${['active', 'published', 'public', 'open'].includes(job.status.toLowerCase()) ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                                    <span className="font-medium text-gray-900 capitalize">
                                        {['active', 'published', 'public', 'open'].includes(job.status.toLowerCase()) ? 'Public' : 'Draft'}
                                    </span>
                                </div>
                                <span className="text-gray-300">|</span>
                                <span>{new Date(job.addedDate).toLocaleDateString()}</span>
                                <span className="text-gray-300">|</span>
                                <div className="flex items-center gap-1">
                                    <Info className="h-3 w-3 text-gray-400" />
                                    <span>English - English (US)</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="job_details" className="mt-6">
                        <div className="space-y-6">
                            {/* Job Fields Section */}
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer" onClick={() => {
                                    const el = document.getElementById('job-fields-content');
                                    if (el) el.classList.toggle('hidden');
                                }}>
                                    <div className="flex items-center gap-2">
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                        <h3 className="font-semibold text-gray-900">Job Fields</h3>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900" onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/jobs/${job.id}/edit`);
                                    }}>
                                        <div className="flex items-center gap-1"><span className="text-xs">Edit</span></div>
                                    </Button>
                                </div>
                                <div id="job-fields-content" className="p-6">
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                        <div className="space-y-6">
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase mb-1">REF code</div>
                                                <div className="text-sm text-gray-900">REF{job.id}M</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase mb-1">Target date for hiring</div>
                                                <div className="text-sm text-gray-900">{job.target_hiring_date ? new Date(job.target_hiring_date).toLocaleDateString() : "-"}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase mb-1">Function</div>
                                                <div className="text-sm text-gray-900">{job.job_function || "-"}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase mb-1">Type of Employment</div>
                                                <div className="text-sm text-gray-900">{job.type_of_employment || "-"}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase mb-1">Compensation</div>
                                                <div className="text-sm text-gray-900">
                                                    From: <span className="text-gray-600">{job.salary_from || "not selected"}</span> To: <span className="text-gray-600">{job.salary_to || "not selected"}</span> Currency: <span className="text-gray-600">{job.currency || "not selected"}</span>
                                                    <br />
                                                    Salary period: <span className="text-gray-600">{job.salary_period || "not selected"}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase mb-1">Industry</div>
                                                <div className="text-sm text-gray-900">{job.industry || "Hospital And Health Care"}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase mb-1">Experience Level</div>
                                                <div className="text-sm text-gray-900">{job.experience_level || "-"}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Internal Notes Section */}
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer" onClick={() => {
                                    const el = document.getElementById('internal-notes-content');
                                    if (el) el.classList.toggle('hidden');
                                }}>
                                    <div className="flex items-center gap-2">
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                        <h3 className="font-semibold text-gray-900">Internal Notes</h3>
                                    </div>
                                </div>
                                <div id="internal-notes-content" className="p-6">
                                    <textarea
                                        className="w-full min-h-[120px] p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
                                        placeholder="Add additional notes to this job."
                                        value={internalNotes}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                        onFocus={() => setIsEditingNotes(true)}
                                    />
                                    {isEditingNotes && (
                                        <div className="flex gap-2 mt-4">
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                                                try {
                                                    const res = await fetch(`/api/jobs/${job.id}`, {
                                                        method: "PATCH",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ internal_notes: internalNotes }),
                                                    });
                                                    if (!res.ok) throw new Error("Failed to save");
                                                    toast.success("Notes saved");
                                                    setIsEditingNotes(false);
                                                    fetchJobData();
                                                } catch (err) {
                                                    toast.error("Failed to save notes");
                                                }
                                            }}>Save</Button>
                                            <Button size="sm" variant="ghost" className="text-gray-600 hover:bg-gray-100" onClick={() => {
                                                setInternalNotes(job.internal_notes || "");
                                                setIsEditingNotes(false);
                                            }}>Cancel</Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer" onClick={() => {
                                    const el = document.getElementById('attachments-content');
                                    if (el) el.classList.toggle('hidden');
                                }}>
                                    <div className="flex items-center gap-2">
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                        <h3 className="font-semibold text-gray-900">Attachments</h3>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        id="attachment-upload"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const formData = new FormData();
                                            formData.append('file', file);

                                            const toastId = toast.loading("Uploading...");

                                            try {
                                                const res = await fetch('/api/upload', {
                                                    method: 'POST',
                                                    body: formData
                                                });
                                                const data = await res.json();

                                                if (data.success) {
                                                    const newAttachment = { name: data.name, url: data.url, date: new Date().toISOString() };
                                                    const currentAttachments = job.attachments ? JSON.parse(job.attachments) : [];
                                                    const updatedAttachments = [...currentAttachments, newAttachment];

                                                    await fetch(`/api/jobs/${job.id}`, {
                                                        method: "PATCH",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ attachments: JSON.stringify(updatedAttachments) }),
                                                    });

                                                    toast.success("Attachment added", { id: toastId });
                                                    fetchJobData();
                                                } else {
                                                    throw new Error(data.error || "Upload failed");
                                                }
                                            } catch (err: any) {
                                                toast.error(err.message || "Failed to upload", { id: toastId });
                                            }
                                            // Reset input
                                            e.target.value = '';
                                        }}
                                    />
                                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900" onClick={(e) => {
                                        e.stopPropagation();
                                        document.getElementById('attachment-upload')?.click();
                                    }}>
                                        <div className="flex items-center gap-1"><span className="text-lg leading-none">+</span> <span className="text-xs">Add</span></div>
                                    </Button>
                                </div>
                                <div id="attachments-content" className="p-6">
                                    {job.attachments && JSON.parse(job.attachments).length > 0 ? (
                                        <div className="space-y-2">
                                            {JSON.parse(job.attachments).map((att: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                                    <a href={att.url || "#"} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-2">
                                                        <span className="truncate max-w-[200px]">{att.name}</span>
                                                    </a>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={async () => {
                                                        if (confirm("Delete attachment?")) {
                                                            const currentAttachments = JSON.parse(job.attachments!);
                                                            const updatedAttachments = currentAttachments.filter((_: any, i: number) => i !== idx);
                                                            try {
                                                                await fetch(`/api/jobs/${job.id}`, {
                                                                    method: "PATCH",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({ attachments: JSON.stringify(updatedAttachments) }),
                                                                });
                                                                toast.success("Attachment removed");
                                                                fetchJobData();
                                                            } catch (err) {
                                                                toast.error("Failed to remove attachment");
                                                            }
                                                        }
                                                    }}>
                                                        <span className="text-xs">✕</span>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">There are no attachments yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <CandidateProfileDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                candidate={selectedCandidate}
            />

            {job && (
                <AddCandidateDialog
                    open={isAddCandidateOpen}
                    onOpenChange={(open) => {
                        setIsAddCandidateOpen(open);
                        if (!open) fetchJobData(); // Refresh list on close
                    }}
                    jobId={job.id}
                    jobTitle={job.job_title}
                />
            )}
        </div>
    );
}
