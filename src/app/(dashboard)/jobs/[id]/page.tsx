"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
    Info,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Check,
    Square,
    CheckSquare,
    X,
    Trash2,
    Users,
    Mail,
    Share2,
    CalendarCheck,
    ArrowRight
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
import HiringTeamManager from "@/components/jobs/HiringTeamManager";
import ScheduleInterviewDialog from "@/components/jobs/ScheduleInterviewDialog";
import InterviewPanelDialog from "@/components/jobs/InterviewPanelDialog";
import MoveToJobDialog from "@/components/jobs/MoveToJobDialog";
import OfferDialog from "@/components/jobs/OfferDialog";
import AppointmentDialog from "@/components/jobs/AppointmentDialog";
import JoiningFormDialog from "@/components/jobs/JoiningFormDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    shortlisted_count: number;
    interview_count: number;
    selected_count: number;
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
    avatar_url?: string;
    score?: number;
    last_status_change_by?: string;
    last_status_changer_role?: string;
    panel_member_count?: number;
    offered_salary?: string;
    offer_letter_url?: string;
    signed_offer_letter_url?: string;
    appointment_letter_url?: string;
    signed_appointment_letter_url?: string;
};

// --- Components ---

const StatusCounterCard = ({ label, count, active = false, onClick }: { label: string, count: number, active?: boolean, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`
        flex flex-col items-center justify-center p-3 rounded-lg border min-w-[100px] h-[72px] cursor-pointer transition-all
        ${active ? 'bg-white border-green-500 shadow-sm ring-1 ring-green-500' : 'bg-white border-gray-200 hover:border-gray-300'}
    `}>
        <span className="text-lg font-bold text-gray-800">{count}</span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">{label}</span>
    </div>
);

const ApplicantRow = ({ app, selected, onSelect, onStatusChange, onDeleteApplication, onDeleteCandidate, onView, onSchedule, onEditPanel, onMoveToJob, onGenerateOffer, onGenerateAppointment, onGenerateJoiningForm }: { app: Application, selected: boolean, onSelect: (id: number) => void, onStatusChange: (id: number, status: string) => void, onDeleteApplication: (id: number) => void, onDeleteCandidate: (id: number) => void, onView: (app: Application) => void, onSchedule: (id: number) => void, onEditPanel: (id: number) => void, onMoveToJob: (id: number) => void, onGenerateOffer: (id: number) => void, onGenerateAppointment: (id: number) => void, onGenerateJoiningForm: (id: number, type?: "joining" | "hostel" | "transport") => void }) => {
    return (
        <div className="flex items-center py-4 px-4 hover:bg-gray-50 border-b border-gray-100 group transition-colors">
            {/* Checkbox */}
            <div className="mr-4">
                <Checkbox
                    checked={selected}
                    onCheckedChange={() => onSelect(app.application_id)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-gray-300"
                />
            </div>

            {/* Avatar & Name */}
            <div
                className="flex items-center gap-3 w-[25%] cursor-pointer group/name"
                onClick={() => window.open(`/people/${app.application_id}`, '_blank')}
            >
                <Avatar className="h-10 w-10 bg-purple-600 text-white group-hover/name:ring-2 ring-purple-100 transition-all">
                    {app.avatar_url && <AvatarImage src={app.avatar_url} />}
                    <AvatarFallback className="bg-purple-600">
                        {app.name ? app.name.substring(0, 2).toUpperCase() : "NA"}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate group-hover/name:text-green-700 transition-colors">{app.name}</div>
                    <div className="text-sm text-gray-500 truncate">{app.current_title || "Candidate"}</div>
                </div>
            </div>

            {/* Actions Menu */}
            <div className="w-[80px] flex justify-center gap-1">
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
                        {app.status === 'withdrawn' ? (
                            <DropdownMenuItem onClick={() => onStatusChange(app.application_id, 'reviewed')}>
                                Unmark from withdrawn
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => onStatusChange(app.application_id, 'withdrawn')}>
                                Mark as withdrawn
                            </DropdownMenuItem>
                        )}
                        {app.status === 'shortlisted' ? (
                            <DropdownMenuItem onClick={() => onStatusChange(app.application_id, 'reviewed')}>
                                Remove from Shortlist
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => onStatusChange(app.application_id, 'shortlisted')}>
                                Mark as Shortlisted
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => onStatusChange(app.application_id, 'interview')}>
                            Invite to interview
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onEditPanel(app.application_id)}>
                            Manage Panel ({app.panel_member_count || 0})
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onStatusChange(app.application_id, 'selected')}>
                            Mark as Selected
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onStatusChange(app.application_id, 'offered')}>
                            Move to Offer
                        </DropdownMenuItem>
                        {app.status === 'offered' && (
                            <DropdownMenuItem onSelect={() => onGenerateOffer(app.application_id)}>
                                Generate Offer Letter
                            </DropdownMenuItem>
                        )}
                        {app.status === 'hired' && (
                            <>
                                <DropdownMenuItem onSelect={() => onGenerateAppointment(app.application_id)}>
                                    Generate Appointment Letter
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onGenerateJoiningForm(app.application_id, "joining")}>
                                    Generate Joining Form
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onGenerateJoiningForm(app.application_id, "hostel")}>
                                    Generate Hostel Form
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onGenerateJoiningForm(app.application_id, "transport")}>
                                    Generate Transport Form
                                </DropdownMenuItem>
                            </>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => toast.info("Feature coming soon")}>
                            Send message
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMoveToJob(app.application_id)}>
                            Add to job
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDeleteApplication(app.application_id)}>
                            Remove from this job
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onDeleteCandidate(app.user_id)}>
                            Delete candidate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onDeleteApplication(app.application_id)}>
                            Delete job application
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>


            {/* Company */}
            <div className="flex-1 text-sm text-gray-700 truncate px-2">
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
                    <span className="text-sm font-medium text-gray-700 capitalize">{app.status === 'reviewed' ? 'In-Review' : app.status.replace('-', ' ')}</span>
                    {app.last_status_change_by && (
                        <span className="text-[10px] text-gray-400">by {app.last_status_change_by}</span>
                    )}
                    <span className="text-xs text-gray-500">{new Date(app.applied_at).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Score (Replaces Rating) */}
            <div className="w-[10%] flex justify-end px-2">
                <div className="flex flex-col items-center justify-center">
                    <Badge variant="outline" className={`
                        ${(app.score || 0) >= 8 ? "border-green-500 text-green-700 bg-green-50" :
                            (app.score || 0) >= 5 ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                                "border-red-500 text-red-700 bg-red-50"}
                        font-bold
                    `}>
                        {app.score || 0} / 10
                    </Badge>
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
    const searchParams = useSearchParams();
    const [job, setJob] = useState<JobData | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [scoreFilter, setScoreFilter] = useState<number | null>(null);
    const [selectedAppIds, setSelectedAppIds] = useState<number[]>([]);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'score', direction: 'desc' });

    const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
    const [internalNotes, setInternalNotes] = useState("");
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [scheduleAppId, setScheduleAppId] = useState<number | null>(null);

    // Interview Panel State
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [panelAppId, setPanelAppId] = useState<number | null>(null);

    // Offer Dialog State
    const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
    const [offerCandidate, setOfferCandidate] = useState<any>(null);

    // Appointment Dialog State
    const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
    const [appointmentCandidate, setAppointmentCandidate] = useState<any>(null);

    // Joining Form Dialog State
    const [isJoiningFormDialogOpen, setIsJoiningFormDialogOpen] = useState(false);
    const [joiningFormCandidate, setJoiningFormCandidate] = useState<any>(null);
    const [joiningFormType, setJoiningFormType] = useState<"joining" | "hostel" | "transport">("joining");

    const handleSchedule = (id: number) => {
        setScheduleAppId(id);
        setIsScheduleOpen(true);
    };
    const [deleteAppId, setDeleteAppId] = useState<number | null>(null);
    const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);
    const [moveAppId, setMoveAppId] = useState<number | null>(null);

    // Initial Data Fetch
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

    useEffect(() => {
        const statusParam = searchParams.get('status');
        if (statusParam) {
            setSelectedStatuses([statusParam]);
        }
    }, [searchParams]);

    const handleStatusCardClick = (status: string | null) => {
        if (status) {
            setSelectedStatuses([status]);
        } else {
            setSelectedStatuses([]);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedAppIds(filteredApplications.map(app => app.application_id));
        } else {
            setSelectedAppIds([]);
        };
    };

    const handleSelectOne = (id: number) => {
        setSelectedAppIds(prev =>
            prev.includes(id) ? prev.filter(appId => appId !== id) : [...prev, id]
        );
    };

    const handleBulkAction = async (action: string) => {
        if (selectedAppIds.length === 0) return;

        try {
            if (action === 'delete') {
                // Implement bulk delete
                await Promise.all(selectedAppIds.map(id => fetch(`/api/user/application/${id}`, { method: 'DELETE' })));
                setApplications(prev => prev.filter(app => !selectedAppIds.includes(app.application_id)));
                toast.success(`Deleted ${selectedAppIds.length} candidate(s)`);
            } else if (['rejected', 'hired', 'withdrawn', 'interview'].includes(action)) {
                // Implement bulk status change
                await Promise.all(selectedAppIds.map(id =>
                    fetch(`/api/user/application/${id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: action })
                    })
                ));
                // Update local state
                setApplications(prev => prev.map(app =>
                    selectedAppIds.includes(app.application_id) ? { ...app, status: action } : app
                ));
                toast.success(`Updated status for ${selectedAppIds.length} candidate(s)`);
            } else {
                toast.info(`${action} action for ${selectedAppIds.length} candidates coming soon`);
            }
            setSelectedAppIds([]); // Clear selection handling
        } catch (error) {
            console.error("Bulk action failed", error);
            toast.error("Failed to perform bulk action");
        }
    };

    const uniqueLocations = useMemo(() => {
        const locs = new Set(applications.map(app => app.city).filter(Boolean));
        return Array.from(locs);
    }, [applications]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter AND Sort Applications
    const filteredApplications = useMemo(() => {
        let result = applications.filter(app => {
            let matches = true;

            // Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                matches = matches && (
                    (app.name?.toLowerCase() || "").includes(query) ||
                    (app.email?.toLowerCase() || "").includes(query) ||
                    (app.current_company?.toLowerCase() || "").includes(query) ||
                    (app.current_title?.toLowerCase() || "").includes(query)
                );
            }

            // Status Filter
            if (selectedStatuses.length > 0) {
                if (selectedStatuses.includes('all_active')) {
                    // Filter for active statuses (exclude rejected, withdrawn, hired)
                    matches = matches && !['rejected', 'withdrawn', 'hired'].includes(app.status.toLowerCase());
                } else {
                    matches = matches && selectedStatuses.some(s => s.toLowerCase() === app.status?.toLowerCase());
                }
            }

            // Location Filter
            if (selectedLocations.length > 0) {
                matches = matches && selectedLocations.includes(app.city);
            }

            // Score Filter
            if (scoreFilter !== null) {
                matches = matches && (app.score || 0) >= scoreFilter;
            }

            return matches;
        });

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = (a as any)[sortConfig.key];
                const bValue = (b as any)[sortConfig.key];

                if (aValue === bValue) return 0;

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                // Handle numeric score explicitly
                if (sortConfig.key === 'score') {
                    const numA = Number(aValue);
                    const numB = Number(bValue);
                    return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                } else {
                    // Fallback for mixed types or non-strings
                    const strA = String(aValue);
                    const strB = String(bValue);
                    return sortConfig.direction === 'asc'
                        ? (strA > strB ? 1 : -1)
                        : (strA < strB ? 1 : -1);
                }
            });
        }
        return result;
    }, [applications, searchQuery, selectedStatuses, selectedLocations, scoreFilter, sortConfig]);

    const updateStatus = async (appId: number, status: string) => {
        if (status === 'interview') {
            setScheduleAppId(appId);
            setIsScheduleOpen(true);
            return;
        }

        if (status === 'selected') {
            const app = applications.find(a => a.application_id === appId);
            if (app && (app.panel_member_count || 0) < 2) {
                toast.error("Minimum 2 panel members required to select candidate");
                return;
            }
        }

        try {
            const res = await fetch(`/api/job-applications/${appId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: status }),
            });

            if (res.ok) {
                toast.success(`Candidate moved to ${status}`);
                fetchJobData(); // Refresh counts and list
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleAnalyze = async (appId: number) => {
        const toastId = toast.loading("Analyzing candidate...");
        try {
            const res = await fetch(`/api/job-applications/${appId}/analyze`, { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Analysis complete. Score: ${data.score}`, { id: toastId });
                fetchJobData();
            } else {
                toast.error("Analysis failed", { id: toastId });
            }
        } catch (error) {
            toast.error("An error occurred", { id: toastId });
        }
    };

    const handleDeleteApplication = (appId: number) => {
        setDeleteAppId(appId);
    };

    const confirmDeleteApplication = async () => {
        if (!deleteAppId) return;

        try {
            const res = await fetch(`/api/job-applications/${deleteAppId}`, {
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
        } finally {
            setDeleteAppId(null);
        }
    };

    const handleDeleteCandidate = (userId: number) => {
        setDeleteCandidateId(userId);
    };

    const confirmDeleteCandidate = async () => {
        if (!deleteCandidateId) return;

        try {
            const res = await fetch(`/api/users/${deleteCandidateId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Candidate deleted permanently");
                fetchJobData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete candidate");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setDeleteCandidateId(null);
        }
    };

    const handleMoveToJob = (appId: number) => {
        setMoveAppId(appId);
    };

    const handleViewProfile = (candidate: Application) => {
        setSelectedCandidate(candidate);
        setDrawerOpen(true);
    };

    const handleEditPanel = (appId: number) => {
        setPanelAppId(appId);
        setIsPanelOpen(true);
    };

    const handleGenerateOffer = (appId: number) => {
        const app = applications.find(a => a.application_id === appId);
        if (app && job) {
            setOfferCandidate({
                ...app,
                job_title: job.job_title,
                department: job.department,
                salary_from: job.salary_from,
            });
            setIsOfferDialogOpen(true);
        }
    };

    const handleGenerateAppointment = (appId: number) => {
        const app = applications.find(a => a.application_id === appId);
        if (app && job) {
            setAppointmentCandidate({
                ...app,
                job_title: job.job_title,
                department: job.department,
                salary_from: job.salary_from,
                offered_salary: app.offered_salary,
                type_of_employment: job.type_of_employment,
            });
            setIsAppointmentDialogOpen(true);
        }
    };

    const handleGenerateJoiningForm = (appId: number, type: "joining" | "hostel" | "transport" = "joining") => {
        const app = applications.find(a => a.application_id === appId);
        if (app && job) {
            setJoiningFormCandidate({
                ...app,
                job_title: job.job_title,
                department: job.department,
            });
            setJoiningFormType(type);
            setIsJoiningFormDialogOpen(true);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-green-600 rounded-full border-t-transparent"></div></div>;
    }

    if (!job) return <div className="p-8">Job not found</div>;

    // Sort Icon Helper
    const renderSortIcon = (key: string) => {
        if (sortConfig?.key === key) {
            return sortConfig.direction === 'asc'
                ? <ArrowUp className="h-4 w-4 ml-1" />
                : <ArrowDown className="h-4 w-4 ml-1" />;
        }
        return <ArrowUpDown className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-30" />;
    };

    const SortableHeader = ({ label, sortKey, className, align = 'left' }: { label: string, sortKey: string, className?: string, align?: 'left' | 'right' }) => (
        <div
            className={`flex items-center cursor-pointer group select-none hover:text-gray-700 ${align === 'right' ? 'justify-end' : ''} ${className}`}
            onClick={() => handleSort(sortKey)}
        >
            {label}
            {renderSortIcon(sortKey)}
        </div>
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
                        <StatusCounterCard
                            label="New"
                            count={job.new_count || 0}
                            active={selectedStatuses.includes('new')}
                            onClick={() => handleStatusCardClick('new')}
                        />
                        <StatusCounterCard
                            label="In-review"
                            count={job.in_review_count || 0}
                            active={selectedStatuses.includes('reviewed')}
                            onClick={() => handleStatusCardClick('reviewed')}
                        />
                        <StatusCounterCard
                            label="Shortlisted"
                            count={job.shortlisted_count || 0}
                            active={selectedStatuses.includes('shortlisted')}
                            onClick={() => handleStatusCardClick('shortlisted')}
                        />
                        <StatusCounterCard
                            label="Interview"
                            count={job.interview_count || 0}
                            active={selectedStatuses.includes('interview')}
                            onClick={() => handleStatusCardClick('interview')}
                        />
                        <StatusCounterCard
                            label="Selected"
                            count={job.selected_count || 0}
                            active={selectedStatuses.includes('selected')}
                            onClick={() => handleStatusCardClick('selected')}
                        />
                        <StatusCounterCard
                            label="Offered"
                            count={job.offered_count || 0}
                            active={selectedStatuses.includes('offered')}
                            onClick={() => handleStatusCardClick('offered')}
                        />
                        <StatusCounterCard
                            label="Hired"
                            count={job.hired_count || 0}
                            active={selectedStatuses.includes('hired')}
                            onClick={() => handleStatusCardClick('hired')}
                        />
                        {/* Spacer or Divider */}
                        <div className="w-px bg-gray-200 mx-1 h-[72px]"></div>
                        <StatusCounterCard
                            label="All Active"
                            count={job.all_active_count || 0}
                            active={selectedStatuses.includes('all_active')}
                            onClick={() => handleStatusCardClick('all_active')}
                        />
                        <StatusCounterCard
                            label="Withdrawn"
                            count={job.withdrawn_count || 0}
                            active={selectedStatuses.includes('withdrawn')}
                            onClick={() => handleStatusCardClick('withdrawn')}
                        />
                        <StatusCounterCard
                            label="Rejected"
                            count={job.rejected_count || 0}
                            active={selectedStatuses.includes('rejected')}
                            onClick={() => handleStatusCardClick('rejected')}
                        />
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

                        <TabsTrigger
                            value="hiring_process"
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-gray-900 text-gray-500 rounded-none px-0 pb-3 text-sm font-semibold hover:text-gray-700"
                        >
                            Hiring process
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="applicants" className="mt-6">
                        {/* Bulk Actions Bar */}
                        {selectedAppIds.length > 0 && (
                            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-blue-900 ml-2">
                                        {selectedAppIds.length} of {filteredApplications.length} selected
                                    </span>
                                    <div className="h-4 w-px bg-blue-200"></div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 font-medium h-8">
                                                Actions <ChevronDown className="h-4 w-4 ml-1" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-56">
                                            <DropdownMenuItem onClick={() => handleBulkAction('rejected')}>
                                                <X className="mr-2 h-4 w-4" /> Reject ({selectedAppIds.length})
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleBulkAction('hired')}>
                                                <Check className="mr-2 h-4 w-4" /> Hire ({selectedAppIds.length})
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toast.info("Coming soon")}>
                                                <CalendarCheck className="mr-2 h-4 w-4" /> Invite to event ({selectedAppIds.length})
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toast.info("Coming soon")}>
                                                <Share2 className="mr-2 h-4 w-4" /> Share ({selectedAppIds.length})
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleBulkAction('interview')}>
                                                Change status ({selectedAppIds.length})
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toast.info("Coming soon")}>
                                                <Mail className="mr-2 h-4 w-4" /> Send message ({selectedAppIds.length})
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={() => {
                                                if (confirm(`Delete ${selectedAppIds.length} candidates? This cannot be undone.`)) {
                                                    handleBulkAction('delete');
                                                }
                                            }}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete candidates ({selectedAppIds.length})
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-full" onClick={() => setSelectedAppIds([])}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {/* Filters Bar */}
                        <div className="mb-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-10 h-10 border-gray-300 bg-white"
                                    placeholder="Search By Name Or Email"
                                    value={searchQuery || ""}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                {/* Status Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className={`rounded-full border-gray-300 h-8 text-xs font-medium ${selectedStatuses.length > 0 ? "bg-green-50 border-green-200 text-green-700" : "text-gray-600"}`}>
                                            Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`} <ChevronDown className="h-3 w-3 ml-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56 p-2">
                                        <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Filter by Status</div>
                                        {['new', 'reviewed', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'].map((status) => (
                                            <div key={status} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer" onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedStatuses(prev =>
                                                    prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                                                );
                                            }}>
                                                <Checkbox checked={selectedStatuses.includes(status)} />
                                                <span className="capitalize text-sm">{status === 'reviewed' ? 'In-Review' : status.replace('-', ' ')}</span>
                                            </div>
                                        ))}
                                        {selectedStatuses.length > 0 && (
                                            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-red-500 h-7" onClick={() => setSelectedStatuses([])}>Clear Status</Button>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Score Filter (Replaces Rating) */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className={`rounded-full border-gray-300 h-8 text-xs font-medium ${scoreFilter !== null ? "bg-green-50 border-green-200 text-green-700" : "text-gray-600"}`}>
                                            Score {scoreFilter !== null && `(>=${scoreFilter})`} <ChevronDown className="h-3 w-3 ml-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48 p-1">
                                        <div className="text-xs font-semibold text-gray-500 px-2 py-2">Minimum Score</div>
                                        {[9, 8, 7, 6].map((score) => (
                                            <DropdownMenuItem key={score} onClick={() => setScoreFilter(score)}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{score}+ / 10</span>
                                                    {scoreFilter === score && <Check className="h-4 w-4 text-green-600" />}
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setScoreFilter(null)} className="text-red-600">
                                            Clear Filter
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Location Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className={`rounded-full border-gray-300 h-8 text-xs font-medium ${selectedLocations.length > 0 ? "bg-green-50 border-green-200 text-green-700" : "text-gray-600"}`}>
                                            Location {selectedLocations.length > 0 && `(${selectedLocations.length})`} <ChevronDown className="h-3 w-3 ml-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56 p-2">
                                        <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Filter by Location</div>
                                        {uniqueLocations.length === 0 ? (
                                            <div className="px-2 py-2 text-sm text-gray-400 italic">No locations found</div>
                                        ) : (
                                            uniqueLocations.map((loc) => (
                                                <div key={loc} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer" onClick={(e) => {
                                                    e.preventDefault();
                                                    setSelectedLocations(prev =>
                                                        prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
                                                    );
                                                }}>
                                                    <Checkbox checked={selectedLocations.includes(loc)} />
                                                    <span className="text-sm truncate">{loc}</span>
                                                </div>
                                            ))
                                        )}
                                        {selectedLocations.length > 0 && (
                                            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-red-500 h-7" onClick={() => setSelectedLocations([])}>Clear Location</Button>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <p className="text-sm text-gray-500">Showing {filteredApplications.length} of {applications.length} applicants</p>
                            </div>
                        </div>

                        {/* Applicants Table */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
                            {/* Table Header */}
                            <div className="flex items-center bg-white border-b border-gray-200 py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <div className="mr-4">
                                    <Checkbox
                                        checked={filteredApplications.length > 0 && selectedAppIds.length === filteredApplications.length}
                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-gray-300"
                                    />
                                </div>
                                <div className="w-[25%]">
                                    <div className="flex items-center cursor-pointer group select-none hover:text-gray-700" onClick={() => handleSort('name')}>
                                        Applicant {renderSortIcon('name')}
                                    </div>
                                </div>
                                <div className="w-[80px]"></div> {/* Actions placeholder */}
                                <div className="flex-1 px-2">
                                    <SortableHeader label="Company" sortKey="current_company" />
                                </div>
                                <div className="w-[15%] px-2">
                                    <SortableHeader label="Location" sortKey="city" />
                                </div>
                                <div className="w-[15%] px-2">
                                    <SortableHeader label="Status" sortKey="status" />
                                </div>
                                <div className="w-[10%] px-2">
                                    <SortableHeader label="Score" sortKey="score" align="right" />
                                </div>
                                <div className="w-[10%] px-2">
                                    <SortableHeader label="Application date" sortKey="applied_at" align="right" />
                                </div>
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
                                    filteredApplications.map((app: Application) => (
                                        <ApplicantRow
                                            key={app.application_id}
                                            app={app}
                                            selected={selectedAppIds.includes(app.application_id)}
                                            onSelect={handleSelectOne}
                                            onStatusChange={updateStatus}
                                            onDeleteApplication={handleDeleteApplication}
                                            onDeleteCandidate={handleDeleteCandidate}
                                            onView={handleViewProfile}
                                            onSchedule={handleSchedule}
                                            onEditPanel={handleEditPanel}
                                            onMoveToJob={handleMoveToJob}
                                            onGenerateOffer={handleGenerateOffer}
                                            onGenerateAppointment={handleGenerateAppointment}
                                            onGenerateJoiningForm={handleGenerateJoiningForm}
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

                    <TabsContent value="hiring_process" className="p-0 space-y-8 mt-6">
                        {/* Process Visual */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Default hiring process</h3>
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                <div className="flex-shrink-0 px-4 py-2 bg-blue-50 text-blue-700 rounded text-sm font-medium min-w-[120px] text-center">In-Review</div>
                                <div className="w-8 h-0.5 bg-gray-200"></div>
                                <div className="flex-shrink-0 px-4 py-2 bg-gray-50 text-gray-500 rounded text-sm font-medium min-w-[120px] text-center">Interview</div>
                                <div className="w-8 h-0.5 bg-gray-200"></div>
                                <div className="flex-shrink-0 px-4 py-2 bg-gray-50 text-gray-500 rounded text-sm font-medium min-w-[120px] text-center">Offer</div>
                            </div>
                            <div className="mt-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded border border-blue-200 bg-blue-50 text-blue-600">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <p className="text-xs text-center mt-1 text-gray-500 w-16">Short-Listed</p>
                            </div>
                        </div>

                        {/* Hiring Team */}
                        <HiringTeamManager jobId={job.id} />

                        {/* Interview Scorecard */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                <h3 className="font-semibold text-gray-900">Interview Scorecard</h3>
                            </div>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">Add</Button>
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

            {/* Interview Schedule Dialog */}
            <ScheduleInterviewDialog
                isOpen={isScheduleOpen}
                onClose={() => setIsScheduleOpen(false)}
                applicationId={scheduleAppId}
                onSuccess={fetchJobData}
            />

            {/* Interview Panel Dialog */}
            <InterviewPanelDialog
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                applicationId={panelAppId}
            />
            {/* Delete Application Dialog */}
            <AlertDialog open={!!deleteAppId} onOpenChange={(open) => !open && setDeleteAppId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job Application?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this job application? This action cannot be undone and all data associated with this specific application will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteApplication} className="bg-red-600 hover:bg-red-700">
                            Delete Application
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Candidate Dialog */}
            <AlertDialog open={!!deleteCandidateId} onOpenChange={(open) => !open && setDeleteCandidateId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Candidate Permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this candidate? This will permanently delete their user account, profile, and ALL applications they have submitted. This action CANNOT be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteCandidate} className="bg-red-600 hover:bg-red-700">
                            Delete Candidate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Move to Job Dialog */}
            <MoveToJobDialog
                open={!!moveAppId}
                onOpenChange={(open) => !open && setMoveAppId(null)}
                applicationId={moveAppId}
                currentJobId={job.id}
                onSuccess={fetchJobData}
            />

            {/* Offer Dialog */}
            <OfferDialog
                open={isOfferDialogOpen}
                onOpenChange={setIsOfferDialogOpen}
                candidate={offerCandidate}
                onSuccess={(url) => {
                    fetchJobData();
                    setOfferCandidate(null);
                }}
            />

            {/* Appointment Dialog */}
            <AppointmentDialog
                open={isAppointmentDialogOpen}
                onOpenChange={setIsAppointmentDialogOpen}
                candidate={appointmentCandidate}
                onSuccess={(url) => {
                    fetchJobData();
                    setAppointmentCandidate(null);
                }}
            />

            {/* Joining Form Dialog */}
            <JoiningFormDialog
                open={isJoiningFormDialogOpen}
                onOpenChange={setIsJoiningFormDialogOpen}
                candidate={joiningFormCandidate}
                formType={joiningFormType}
                onSuccess={(url) => {
                    fetchJobData();
                    setJoiningFormCandidate(null);
                }}
            />

        </div>
    );
}
