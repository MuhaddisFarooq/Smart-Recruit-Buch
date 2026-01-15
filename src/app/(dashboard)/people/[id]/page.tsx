
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
    avatar_url?: string;
    score?: number;
    message?: string;
    offer_letter_url?: string;
    signed_offer_letter_url?: string;
    appointment_letter_url?: string;
    signed_appointment_letter_url?: string;
    department?: string;
    salary_from?: string;
    type_of_employment?: string;
    offered_salary?: string;
};

import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import AppointmentDialog from "@/components/jobs/AppointmentDialog";
import MoveToJobDialog from "@/components/jobs/MoveToJobDialog";
import OfferDialog from "@/components/jobs/OfferDialog";

import JoiningFormDialog from "@/components/jobs/JoiningFormDialog";

export default function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
    const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
    const [appointmentCandidate, setAppointmentCandidate] = useState<any>(null);


    const [isJoiningDialogOpen, setIsJoiningDialogOpen] = useState(false);
    const [joiningCandidate, setJoiningCandidate] = useState<any>(null);

    // Tab State
    const [activeTab, setActiveTab] = useState("Overview");
    const [subTab, setSubTab] = useState("Resume");
    const [reviews, setReviews] = useState<any[]>([]);
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [newReviewText, setNewReviewText] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    // Notes State
    const [notes, setNotes] = useState<any[]>([]);
    const [newNoteText, setNewNoteText] = useState("");
    const [submittingNote, setSubmittingNote] = useState(false);

    // Add Experience State
    const [isAddExpOpen, setIsAddExpOpen] = useState(false);
    const [expForm, setExpForm] = useState({
        title: "",
        company: "",
        location: "",
        start_date: "",
        end_date: "",
        is_current: false,
        description: ""
    });
    const [submittingExp, setSubmittingExp] = useState(false);

    // Add Education State
    const [isAddEduOpen, setIsAddEduOpen] = useState(false);
    const [eduForm, setEduForm] = useState({
        institution: "",
        degree: "",
        major: "",
        location: "",
        start_date: "",
        end_date: "",
        is_current: false,
        description: ""
    });
    const [submittingEdu, setSubmittingEdu] = useState(false);

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

    const fetchReviews = async (userId: number) => {
        try {
            const res = await fetch(`/api/people/${userId}/reviews`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (error) {
            console.error("Failed to fetch reviews");
        }
    };

    useEffect(() => {
        if (activeTab === "Reviews" && candidate?.user_id) {
            fetchReviews(candidate.user_id);
        }
        if (activeTab === "Notes" && candidate?.user_id) {
            fetchNotes(candidate.user_id);
        }
    }, [activeTab, candidate?.user_id]);

    const fetchNotes = async (userId: number) => {
        try {
            const res = await fetch(`/api/people/${userId}/notes`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (error) {
            console.error("Failed to fetch notes");
        }
    };

    const submitNote = async () => {
        if (!candidate) return;
        if (!newNoteText.trim()) {
            toast.error("Please enter a note");
            return;
        }

        setSubmittingNote(true);
        try {
            const res = await fetch(`/api/people/${candidate.user_id}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note_text: newNoteText })
            });

            if (res.ok) {
                toast.success("Note added");
                setNewNoteText("");
                fetchNotes(candidate.user_id);
            } else {
                toast.error("Failed to add note");
            }
        } catch (error) {
            toast.error("Error adding note");
        } finally {
            setSubmittingNote(false);
        }
    };

    const submitReview = async () => {
        if (!candidate) return;
        if (newReviewRating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setSubmittingReview(true);
        try {
            const res = await fetch(`/api/people/${candidate.user_id}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating: newReviewRating, review_text: newReviewText })
            });

            if (res.ok) {
                toast.success("Review submitted");
                setNewReviewRating(0);
                setNewReviewText("");
                fetchReviews(candidate.user_id);
            } else {
                toast.error("Failed to submit review");
            }
        } catch (error) {
            toast.error("Error submitting review");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleGenerateAppointment = () => {
        if (!candidate) return;
        setAppointmentCandidate({
            ...candidate,
            job_title: candidate.job_title,
            department: candidate.department,
            salary_from: candidate.salary_from,
            offered_salary: candidate.offered_salary,
            type_of_employment: candidate.type_of_employment,
            application_id: candidate.application_id // Ensure ID is passed
        });
        setIsAppointmentDialogOpen(true);
    };

    const handleGenerateJoiningForm = () => {
        if (!candidate) return;
        setJoiningCandidate({
            ...candidate,
            job_title: candidate.job_title,
            department: candidate.department,
            application_id: candidate.application_id
        });
        setIsJoiningDialogOpen(true);
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

    const submitExperience = async () => {
        if (!candidate) return;
        if (!expForm.title || !expForm.company) {
            toast.error("Title and Company are required");
            return;
        }

        setSubmittingExp(true);
        try {
            const res = await fetch(`/api/people/${candidate.user_id}/experience`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(expForm)
            });

            if (res.ok) {
                toast.success("Experience added");
                setIsAddExpOpen(false);
                setExpForm({
                    title: "",
                    company: "",
                    location: "",
                    start_date: "",
                    end_date: "",
                    is_current: false,
                    description: ""
                });
                fetchCandidate(); // Refresh list
            } else {
                toast.error("Failed to add experience");
            }
        } catch (error) {
            toast.error("Error adding experience");
        } finally {
            setSubmittingExp(false);
        }
    };

    const submitEducation = async () => {
        if (!candidate) return;
        if (!eduForm.institution) {
            toast.error("Institution is required");
            return;
        }

        setSubmittingEdu(true);
        try {
            const res = await fetch(`/api/people/${candidate.user_id}/education`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(eduForm)
            });

            if (res.ok) {
                toast.success("Education added");
                setIsAddEduOpen(false);
                setEduForm({
                    institution: "",
                    degree: "",
                    major: "",
                    location: "",
                    start_date: "",
                    end_date: "",
                    is_current: false,
                    description: ""
                });
                fetchCandidate(); // Refresh list
            } else {
                toast.error("Failed to add education");
            }
        } catch (error) {
            toast.error("Error adding education");
        } finally {
            setSubmittingEdu(false);
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
            <div className="animate-spin h-8 w-8 border-2 border-[#b9d36c] rounded-full border-t-transparent"></div>
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
                                {candidate.avatar_url && <AvatarImage src={candidate.avatar_url} className="object-cover" />}
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
                        {['Overview', 'Communication', 'Reviews', 'Notes'].map((tab) => (
                            <div
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-sm font-semibold cursor-pointer border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-[#b9d36c] text-[#b9d36c]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                                {tab === 'Communication' && (candidate.message || 0) !== 0 && <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{candidate.message ? 1 : 0}</span>}
                            </div>
                        ))}

                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 flex gap-8 items-start">

                {/* Main Content Area (Left) */}
                <div className="flex-1 min-w-0 space-y-6">

                    {activeTab === 'Overview' && (
                        <>
                            {/* Sub-Tabs: Resume / Experience / Education */}
                            <div className="flex items-center gap-3 mb-6">
                                <Button
                                    variant={subTab === 'Resume' ? 'default' : 'outline'}
                                    onClick={() => setSubTab('Resume')}
                                    className={`gap-2 ${subTab === 'Resume' ? 'bg-[#b9d36c] hover:bg-[#a3bd5b] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <FileText className="h-4 w-4" /> Resume
                                </Button>
                                <Button
                                    variant={subTab === 'Experience' ? 'default' : 'outline'}
                                    onClick={() => setSubTab('Experience')}
                                    className={`gap-2 ${subTab === 'Experience' ? 'bg-[#b9d36c] hover:bg-[#a3bd5b] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Building2 className="h-4 w-4" /> Experience
                                </Button>
                                <Button
                                    variant={subTab === 'Education' ? 'default' : 'outline'}
                                    onClick={() => setSubTab('Education')}
                                    className={`gap-2 ${subTab === 'Education' ? 'bg-[#b9d36c] hover:bg-[#a3bd5b] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <GraduationCap className="h-4 w-4" /> Education
                                </Button>
                            </div>

                            {subTab === 'Resume' && (
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden min-h-[800px]">
                                    {candidate.resume_url ? (
                                        <iframe
                                            src={`${(candidate.resume_url.endsWith('bin') || candidate.resume_url.includes('upload'))
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

                            {subTab === 'Experience' && (
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-base font-semibold text-gray-900">Experience</h3>
                                        <Button variant="ghost" size="sm" className="text-[#b9d36c] hover:bg-[#b9d36c]/10 text-xs font-semibold uppercase" onClick={() => setIsAddExpOpen(true)}>Add</Button>
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
                            )}

                            {subTab === 'Education' && (
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-base font-semibold text-gray-900">Education</h3>
                                        <Button variant="ghost" size="sm" className="text-[#b9d36c] hover:bg-[#b9d36c]/10 text-xs font-semibold uppercase" onClick={() => setIsAddEduOpen(true)}>Add</Button>
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
                            )}
                        </>
                    )}

                    {activeTab === 'Communication' && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-base font-semibold text-gray-900">Communication History</h3>
                            </div>

                            <div className="space-y-6 relative pl-4 border-l-2 border-gray-100 ml-2">
                                {candidate.message ? (
                                    <div className="relative pl-6">
                                        {/* Timeline dot */}
                                        <div className="absolute -left-[33px] top-0 w-4 h-4 rounded-full bg-[#b9d36c] ring-4 ring-white"></div>

                                        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 bg-purple-50 border border-purple-100 text-purple-600">
                                                        <AvatarFallback className="text-sm font-bold">
                                                            {candidate.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{candidate.name}</div>
                                                        <div className="text-xs text-gray-500">Applicant • {new Date(candidate.applied_at).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-xs font-normal text-gray-500 bg-gray-50">
                                                    Application Message
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-1">
                                                {candidate.message}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pl-6 text-sm text-gray-400 italic py-8">No communication history found</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Reviews' && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            {/* Review Form */}
                            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Overall Rating*</h3>
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={`text-2xl cursor-pointer ${star <= newReviewRating ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400 transition-colors`}
                                            onClick={() => setNewReviewRating(star)}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <textarea
                                    className="w-full h-24 p-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#b9d36c] resize-none"
                                    placeholder="Enter your feedback"
                                    value={newReviewText}
                                    onChange={(e) => setNewReviewText(e.target.value)}
                                />
                                <div className="flex justify-end gap-2 mt-3">
                                    <Button variant="ghost" onClick={() => { setNewReviewRating(0); setNewReviewText(""); }}>Cancel</Button>
                                    <Button className="bg-[#b9d36c] hover:bg-[#a3bd5b] text-white" disabled={submittingReview} onClick={submitReview}>
                                        {submittingReview ? "Submitting..." : "Submit Review"}
                                    </Button>
                                </div>
                            </div>

                            {/* Reviews List */}
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Reviews ({reviews.length})</h3>
                            <div className="space-y-4">
                                {reviews.length === 0 ? (
                                    <p className="text-gray-500 italic text-sm">No reviews yet.</p>
                                ) : (
                                    reviews.map((review: any) => (
                                        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="font-semibold text-sm text-gray-900">
                                                        {review.reviewer_name || "Unknown"}
                                                        <span className="text-gray-500 font-normal"> - {review.reviewer_role || "Reviewer"}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">• {new Date(review.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex text-yellow-500 text-sm">
                                                    {Array(5).fill(0).map((_, i) => (
                                                        <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{review.review_text}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Notes' && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            {/* Note Input */}
                            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100 relative">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-gray-700 mb-1">#{candidate?.name}</div>
                                        <textarea
                                            className="w-full h-20 p-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#b9d36c] resize-none"
                                            placeholder="Write a note..."
                                            value={newNoteText}
                                            onChange={(e) => setNewNoteText(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-2 pl-11">
                                    <div className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                                        ⓘ
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <div className="text-xs font-semibold text-gray-500 cursor-pointer flex items-center gap-1">
                                            + Open note <span className="text-[10px]">▼</span>
                                        </div>
                                        <Button
                                            className="bg-[#166534] hover:bg-[#14532d] text-white px-6 h-8 text-sm font-semibold"
                                            disabled={submittingNote}
                                            onClick={submitNote}
                                        >
                                            {submittingNote ? "Posting..." : "Post"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Notes List */}
                            <div className="space-y-6 pl-4 border-l-2 border-gray-100 ml-4">
                                {notes.length === 0 ? (
                                    <p className="text-gray-500 italic text-sm pl-4">No notes yet.</p>
                                ) : (
                                    notes.map((note: any) => (
                                        <div key={note.id} className="relative pl-6 pb-2">
                                            {/* Timeline dot */}
                                            <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>

                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-sm text-gray-900">{note.author_name || "Unknown"}</span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 rounded">{note.author_role || "User"}</span>
                                                    <span className="text-xs text-gray-400">• {new Date(note.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg border border-gray-100 text-sm text-gray-700 mt-1 inline-block">
                                                {note.note_text}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
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

                        <div className="flex gap-2 mb-2 items-center">
                            <Badge variant="outline" className={`
                                ${(candidate.score || 0) >= 8 ? "border-green-500 text-green-700 bg-green-50" :
                                    (candidate.score || 0) >= 5 ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                                        "border-red-500 text-red-700 bg-red-50"}
                                font-bold px-2 py-0.5
                            `}>
                                Score: {candidate.score || 0} / 10
                            </Badge>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1 mb-6">
                            <p>{candidate.city}, {candidate.country}</p>
                            <p>From Default Career Page • {new Date(candidate.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>

                        {/* Progress Bar (Visual Only) */}
                        <div className="relative mb-6">
                            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                                <span className={['new', 'reviewed', 'shortlisted'].includes(candidate.status) ? 'text-[#b9d36c]' : ''}>New</span>
                                <span className={['interview'].includes(candidate.status) ? 'text-[#b9d36c]' : ''}>In Review</span>
                                <span className={['offered'].includes(candidate.status) ? 'text-[#b9d36c]' : ''}>Interview</span>
                                <span className={['hired'].includes(candidate.status) ? 'text-[#b9d36c]' : ''}>Offered</span>
                                <span className={['hired'].includes(candidate.status) ? 'text-[#b9d36c]' : ''}>Hired</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-[#b9d36c] rounded-full ${candidate.status === 'new' ? 'w-[5%]' :
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
                                    className="flex-1 bg-[#b9d36c] hover:bg-[#a3bd5b] text-white font-bold rounded-r-none h-9"
                                    onClick={() => handleStatusChange('reviewed')}
                                >
                                    Move forward
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="bg-[#b9d36c] hover:bg-[#a3bd5b] text-white px-2 rounded-l-none h-9">
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
                                                    {candidate.status === status && <span className="text-[#b9d36c] font-bold">✓</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <Button variant="outline" className="flex-1 border-[#b9d36c] text-[#b9d36c] hover:bg-[#b9d36c]/10 font-bold h-9 bg-white" onClick={() => handleStatusChange('rejected')}>
                                Reject
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="border-[#b9d36c] text-[#b9d36c] hover:bg-[#b9d36c]/10 w-9 h-9 shrink-0 bg-white">
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
                                    {candidate.status === 'offered' && (
                                        <DropdownMenuItem onClick={() => setIsOfferDialogOpen(true)}>
                                            Generate Offer Letter
                                        </DropdownMenuItem>
                                    )}
                                    {candidate.status === 'hired' && (
                                        <>
                                            <DropdownMenuItem onClick={handleGenerateAppointment}>
                                                Generate Appointment Letter
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleGenerateJoiningForm}>
                                                Generate Joining Form
                                            </DropdownMenuItem>
                                        </>
                                    )}
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
                            open={isMoveDialogOpen}
                            onOpenChange={setIsMoveDialogOpen}
                            currentJobId={candidate.job_id}
                            applicationId={candidate.application_id}
                            onSuccess={() => {
                                fetchCandidate();
                                router.push(`/jobs`); // Or refresh page to see new job link
                            }}
                        />

                        <OfferDialog
                            open={isOfferDialogOpen}
                            onOpenChange={setIsOfferDialogOpen}
                            candidate={candidate}
                            onSuccess={(url) => {
                                fetchCandidate();
                                // Status is updated by the API called inside OfferDialog
                            }}
                        />

                        <AppointmentDialog
                            open={isAppointmentDialogOpen}
                            onOpenChange={setIsAppointmentDialogOpen}
                            candidate={appointmentCandidate}
                            onSuccess={(url) => {
                                fetchCandidate();
                                setAppointmentCandidate(null);
                            }}
                        />

                        {/* Add Experience Dialog */}
                        <Dialog open={isAddExpOpen} onOpenChange={setIsAddExpOpen}>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Add Experience</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Job Title *</Label>
                                            <Input id="title" value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company">Company *</Label>
                                            <Input id="company" value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        <Input id="location" value={expForm.location} onChange={(e) => setExpForm({ ...expForm, location: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="exp-start">Start Date</Label>
                                            <Input type="date" id="exp-start" value={expForm.start_date} onChange={(e) => setExpForm({ ...expForm, start_date: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="exp-end">End Date</Label>
                                            <Input type="date" id="exp-end" value={expForm.end_date} onChange={(e) => setExpForm({ ...expForm, end_date: e.target.value })} disabled={expForm.is_current} />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="exp-current" checked={expForm.is_current} onCheckedChange={(c) => setExpForm({ ...expForm, is_current: !!c })} />
                                        <Label htmlFor="exp-current">I currently work here</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <Textarea id="description" value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddExpOpen(false)}>Cancel</Button>
                                    <Button onClick={submitExperience} disabled={submittingExp}>
                                        {submittingExp ? "Saving..." : "Save"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Add Education Dialog */}
                        <Dialog open={isAddEduOpen} onOpenChange={setIsAddEduOpen}>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Add Education</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="institution">Institution *</Label>
                                        <Input id="institution" value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="degree">Degree</Label>
                                            <Input id="degree" value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="major">Major / Field of Study</Label>
                                            <Input id="major" value={eduForm.major} onChange={(e) => setEduForm({ ...eduForm, major: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edu-location">Location</Label>
                                        <Input id="edu-location" value={eduForm.location} onChange={(e) => setEduForm({ ...eduForm, location: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edu-start">Start Date</Label>
                                            <Input type="date" id="edu-start" value={eduForm.start_date} onChange={(e) => setEduForm({ ...eduForm, start_date: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edu-end">End Date</Label>
                                            <Input type="date" id="edu-end" value={eduForm.end_date} onChange={(e) => setEduForm({ ...eduForm, end_date: e.target.value })} disabled={eduForm.is_current} />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="edu-current" checked={eduForm.is_current} onCheckedChange={(c) => setEduForm({ ...eduForm, is_current: !!c })} />
                                        <Label htmlFor="edu-current">I currently study here</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edu-desc">Description (Optional)</Label>
                                        <Textarea id="edu-desc" value={eduForm.description} onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddEduOpen(false)}>Cancel</Button>
                                    <Button onClick={submitEducation} disabled={submittingEdu}>
                                        {submittingEdu ? "Saving..." : "Save"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded">
                                <span className="text-gray-400">↳</span> Linked job applications
                            </div>
                        </div>
                    </div>





                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-4 flex justify-between items-center">
                            <h4 className="font-medium text-gray-700">Attachments</h4>
                            <div className="relative">
                                <span
                                    className="text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-[#b9d36c]"
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
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}

                        {(candidate as any).offer_letter_url && (
                            <div className="px-4 pb-4 pt-0">
                                <div
                                    className="flex items-center gap-3 text-sm text-blue-600 hover:underline cursor-pointer group"
                                    onClick={() => window.open((candidate as any).offer_letter_url, '_blank')}
                                >
                                    <FileText className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                                    Offer Letter
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4 text-gray-300 ml-auto hover:text-gray-600" />
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                window.open((candidate as any).offer_letter_url, '_blank');
                                            }}>
                                                Download
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}

                        {(candidate as any).signed_offer_letter_url && (
                            <div className="px-4 pb-4 pt-0">
                                <div
                                    className="flex items-center gap-3 text-sm text-green-600 hover:underline cursor-pointer group"
                                    onClick={() => window.open((candidate as any).signed_offer_letter_url, '_blank')}
                                >
                                    <FileText className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                                    Signed Offer
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4 text-gray-300 ml-auto hover:text-gray-600" />
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                window.open((candidate as any).signed_offer_letter_url, '_blank');
                                            }}>
                                                Download
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}

                        {(candidate as any).appointment_letter_url && (
                            <div className="px-4 pb-4 pt-0">
                                <div
                                    className="flex items-center gap-3 text-sm text-blue-600 hover:underline cursor-pointer group"
                                    onClick={() => window.open((candidate as any).appointment_letter_url, '_blank')}
                                >
                                    <FileText className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                                    Appointment Letter
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4 text-gray-300 ml-auto hover:text-gray-600" />
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                window.open((candidate as any).appointment_letter_url, '_blank');
                                            }}>
                                                Download
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}

                        {(candidate as any).signed_appointment_letter_url && (
                            <div className="px-4 pb-4 pt-0">
                                <div
                                    className="flex items-center gap-3 text-sm text-green-600 hover:underline cursor-pointer group"
                                    onClick={() => window.open((candidate as any).signed_appointment_letter_url, '_blank')}
                                >
                                    <FileText className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                                    Signed Appointment
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4 text-gray-300 ml-auto hover:text-gray-600" />
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                window.open((candidate as any).signed_appointment_letter_url, '_blank');
                                            }}>
                                                Download
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}

                        {(candidate as any).joining_form_url && (
                            <div className="px-4 pb-4 pt-0">
                                <div
                                    className="flex items-center gap-3 text-sm text-blue-600 hover:underline cursor-pointer group"
                                    onClick={() => window.open((candidate as any).joining_form_url, '_blank')}
                                >
                                    <FileText className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                                    Joining Form
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4 text-gray-300 ml-auto hover:text-gray-600" />
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                window.open((candidate as any).joining_form_url, '_blank');
                                            }}>
                                                Download
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        )}
                    </div>




                </aside>
            </main >
            {/* Joining Form Dialog */}
            <JoiningFormDialog
                open={isJoiningDialogOpen}
                onOpenChange={setIsJoiningDialogOpen}
                candidate={joiningCandidate}
                onSuccess={(url) => {
                    fetchCandidate();
                    setJoiningCandidate(null);
                }}
            />

        </div >
    );
}

