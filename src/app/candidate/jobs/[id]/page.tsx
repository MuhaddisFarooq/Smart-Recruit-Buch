"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, MapPin, Briefcase, Linkedin, Facebook, Twitter, Mail, ExternalLink, UserPlus, LogIn } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Job = {
    id: number;
    job_title: string;
    location: string;
    city: string;
    state: string;
    country: string;
    type_of_employment: string;
    company_description: string;
    description: string;
    qualifications: string;
    additional_information: string;
    addedBy: string;
    status: string;
    has_applied: boolean;
};

type OtherJob = {
    id: number;
    job_title: string;
    location: string;
    city: string;
};

export default function JobDetailPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;
    const { data: session } = useSession();
    const pathname = usePathname();

    const [job, setJob] = useState<Job | null>(null);
    const [otherJobs, setOtherJobs] = useState<OtherJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<"apply" | "refer" | null>(null);

    useEffect(() => {
        fetchJob();
        fetchOtherJobs();
    }, [jobId]);

    const fetchJob = async () => {
        try {
            const res = await fetch(`/api/jobs/${jobId}`);
            if (res.ok) {
                const data = await res.json();
                setJob(data);
            } else {
                router.push("/candidate/jobs");
            }
        } catch (error) {
            console.error("Error fetching job:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOtherJobs = async () => {
        try {
            const res = await fetch("/api/jobs");
            if (res.ok) {
                const data = await res.json();
                // Get other published jobs (exclude current)
                const others = data
                    .filter((j: OtherJob) => j.id !== parseInt(jobId))
                    .filter((j: any) => j.status?.toLowerCase() === 'active' || j.status?.toLowerCase() === 'published')
                    .slice(0, 3);
                setOtherJobs(others);
            }
        } catch (error) {
            console.error("Error fetching other jobs:", error);
        }
    };

    const handleApply = () => {
        if (job?.has_applied) return;

        if (!session) {
            setPendingAction("apply");
            setIsAuthDialogOpen(true);
            return;
        }

        router.push(`/candidate/jobs/${jobId}/apply`);
    };

    const handleRefer = () => {
        if (!session) {
            setPendingAction("refer");
            setIsAuthDialogOpen(true);
            return;
        }
        router.push(`/candidate/jobs/${jobId}/refer`);
    };

    const handleAuthRedirect = (type: "login" | "register") => {
        const targetPath = pendingAction === "refer"
            ? `/candidate/jobs/${jobId}/refer`
            : `/candidate/jobs/${jobId}/apply`;

        const returnUrl = encodeURIComponent(targetPath);
        const baseUrl = type === "register" ? "/register" : "/";

        router.push(`${baseUrl}?callbackUrl=${returnUrl}`);
    };

    const getLocationString = () => {
        const parts = [job?.city, job?.state, job?.country].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : job?.location || "Location not specified";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b9d36c]"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="text-center py-12">
                <p className="text-[#666]">Job not found</p>
                <Link href="/candidate/jobs" className="text-[#b9d36c] hover:underline">
                    Back to Jobs
                </Link>
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

            <div className="relative z-10 max-w-[1200px] mx-auto py-12 px-6">
                {/* Back Link */}
                <Link
                    href="/candidate/jobs"
                    className="inline-flex items-center gap-2 text-base text-white/80 hover:text-white mb-8 transition-colors group"
                >
                    <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-all">
                        <ArrowLeft className="h-5 w-5" />
                    </div>
                    <span className="font-medium">Back to Jobs</span>
                </Link>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Job Header */}
                        <div className="mb-8 text-white">
                            <div className="flex items-center gap-4 mb-4">
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{job.job_title}</h1>
                                {!!job.has_applied && (
                                    <span className="px-4 py-1.5 bg-green-500/20 text-green-400 border border-green-500/50 text-sm font-bold rounded-full uppercase tracking-wide backdrop-blur-sm">
                                        Applied
                                    </span>
                                )}
                            </div>
                            <p className="text-xl text-white/90 font-light flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-[#b9d36c]" />
                                {getLocationString()}
                                {job.type_of_employment && (
                                    <>
                                        <span className="mx-2">•</span>
                                        <Briefcase className="h-5 w-5 text-[#b9d36c]" />
                                        {job.type_of_employment}
                                    </>
                                )}
                            </p>
                        </div>

                        {/* Job Details Card */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-neutral-100">
                            {/* Company Description */}
                            {job.company_description && (
                                <div className="mb-10">
                                    <h2 className="text-xl font-bold text-[#b9d36c] mb-4 uppercase tracking-wider bg-[#b9d36c]/10 inline-block px-4 py-1 rounded-md">Company Description</h2>
                                    <div className="text-lg text-neutral-600 leading-relaxed whitespace-pre-wrap">
                                        {job.company_description}
                                    </div>
                                </div>
                            )}

                            {/* Job Description */}
                            {job.description && (
                                <div className="mb-10">
                                    <h2 className="text-xl font-bold text-[#b9d36c] mb-4 uppercase tracking-wider bg-[#b9d36c]/10 inline-block px-4 py-1 rounded-md">Job Description</h2>
                                    <div className="text-lg text-neutral-600 leading-relaxed whitespace-pre-wrap">
                                        {job.description}
                                    </div>
                                </div>
                            )}

                            {/* Qualifications */}
                            {job.qualifications && (
                                <div className="mb-10">
                                    <h2 className="text-xl font-bold text-[#b9d36c] mb-4 uppercase tracking-wider bg-[#b9d36c]/10 inline-block px-4 py-1 rounded-md">Qualifications</h2>
                                    <div className="text-lg text-neutral-600 leading-relaxed whitespace-pre-wrap">
                                        {job.qualifications}
                                    </div>
                                </div>
                            )}

                            {/* Additional Information */}
                            {job.additional_information && (
                                <div>
                                    <h2 className="text-xl font-bold text-[#b9d36c] mb-4 uppercase tracking-wider bg-[#b9d36c]/10 inline-block px-4 py-1 rounded-md">Additional Information</h2>
                                    <div className="text-lg text-neutral-600 leading-relaxed whitespace-pre-wrap">
                                        {job.additional_information}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-[350px] flex-shrink-0 space-y-6">
                        {/* Action Card */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-neutral-100 sticky top-8">
                            <h3 className="text-xl font-bold text-neutral-800 mb-6">Interested in this role?</h3>

                            {/* Action Buttons */}
                            <button
                                onClick={handleApply}
                                disabled={job.has_applied}
                                className={`w-full py-4 text-lg font-bold rounded-xl transition-all shadow-lg mb-4 transform ${job.has_applied
                                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                                    : "bg-[#b9d36c] text-neutral-900 hover:bg-[#a3bd5b] hover:shadow-xl hover:-translate-y-0.5"
                                    }`}
                            >
                                {job.has_applied ? "APPLIED" : "I'M INTERESTED"}
                            </button>
                            {!!job.has_applied && (
                                <p className="text-center text-sm text-green-600 font-medium mb-4 bg-green-50 py-2 rounded-lg border border-green-100 flex items-center justify-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                    Job Already Applied
                                </p>
                            )}
                            <button
                                onClick={handleRefer}
                                className="w-full py-4 border-2 border-neutral-200 text-neutral-600 text-lg font-semibold rounded-xl hover:border-[#b9d36c] hover:text-[#b9d36c] hover:bg-[#b9d36c]/5 transition-all mb-8"
                            >
                                Refer a friend
                            </button>

                            {/* Share This Job */}
                            <div className="mb-8">
                                <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">Share This Job</p>
                                <div className="flex gap-3">
                                    {[
                                        { Icon: Linkedin, url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, color: "hover:border-[#0077B5] hover:text-[#0077B5]" },
                                        { Icon: Facebook, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, color: "hover:border-[#1877F2] hover:text-[#1877F2]" },
                                        { Icon: Twitter, url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(job.job_title)}`, color: "hover:border-[#1DA1F2] hover:text-[#1DA1F2]" },
                                        { Icon: Mail, url: `mailto:?subject=${encodeURIComponent(job.job_title)}&body=${encodeURIComponent(`Check out this job: ${window.location.href}`)}`, color: "hover:border-neutral-800 hover:text-neutral-800" }
                                    ].map((item, index) => (
                                        <a
                                            key={index}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`w-12 h-12 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-500 bg-white shadow-sm hover:shadow-md transition-all ${item.color}`}
                                        >
                                            <item.Icon className="h-5 w-5" />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Other Jobs at Company */}
                            {otherJobs.length > 0 && (
                                <div>
                                    <div className="h-px bg-neutral-100 my-6"></div>
                                    <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">Other Openings</p>
                                    <div className="space-y-4">
                                        {otherJobs.map((otherJob) => (
                                            <Link
                                                key={otherJob.id}
                                                href={`/candidate/jobs/${otherJob.id}`}
                                                className="block group p-3 -mx-3 rounded-lg hover:bg-neutral-50 transition-colors"
                                            >
                                                <p className="text-base font-semibold text-neutral-800 group-hover:text-[#b9d36c] transition-colors">
                                                    {otherJob.job_title}
                                                </p>
                                                <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {otherJob.city || otherJob.location}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                    <Link
                                        href="/candidate/jobs"
                                        className="inline-flex items-center gap-1 text-base font-medium text-[#b9d36c] hover:text-[#a3bd5b] mt-6"
                                    >
                                        View all jobs
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Auth Required Dialog */}
            <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Join Our Community</DialogTitle>
                        <DialogDescription className="text-center text-base pt-2">
                            {pendingAction === 'refer'
                                ? "Please sign in or create an account to refer a friend for this position."
                                : "Please sign in or create an account to apply for this position."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-4">
                        <Button
                            className="bg-[#b9d36c] hover:bg-[#a3bd5b] text-neutral-900 font-bold h-12 text-lg"
                            onClick={() => handleAuthRedirect('register')}
                        >
                            <UserPlus className="mr-2 h-5 w-5" />
                            Create an Account
                        </Button>
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-neutral-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-neutral-500">Already have an account?</span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="h-12 text-lg border-neutral-300 hover:bg-neutral-50"
                            onClick={() => handleAuthRedirect('login')}
                        >
                            <LogIn className="mr-2 h-5 w-5" />
                            Sign In
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div >
    );
}
