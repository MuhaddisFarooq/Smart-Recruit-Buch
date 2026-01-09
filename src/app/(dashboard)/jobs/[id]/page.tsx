"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    MapPin,
    Briefcase,
    Building2,
    GraduationCap,
    Clock,
    Info,
    Linkedin,
    Facebook,
    Twitter,
    Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Job = {
    id: number;
    job_title: string;
    type_of_employment: string;
    department: string;
    location: string;
    company_description: string;
    qualifications: string;
    experience: string;
    additional_information: string;
    addedBy: string;
    addedDate: string;
    status: string;
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const [job, setJob] = useState<Job | null>(null);
    const [otherJobs, setOtherJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    // Update meta tags when job loads for social sharing
    useEffect(() => {
        if (job) {
            document.title = `${job.job_title} - Buch International Hospital`;

            // Update or create Open Graph meta tags
            const updateMeta = (property: string, content: string) => {
                let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('property', property);
                    document.head.appendChild(meta);
                }
                meta.setAttribute('content', content);
            };

            const updateMetaName = (name: string, content: string) => {
                let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('name', name);
                    document.head.appendChild(meta);
                }
                meta.setAttribute('content', content);
            };

            const description = `${job.job_title} opportunity at Buch International Hospital. Location: ${job.location}. Type: ${job.type_of_employment}. Apply now!`;
            const url = window.location.href;

            // Open Graph tags
            updateMeta('og:title', `${job.job_title} - Buch International Hospital`);
            updateMeta('og:description', description);
            updateMeta('og:url', url);
            updateMeta('og:type', 'website');
            updateMeta('og:site_name', 'Buch International Hospital Careers');

            // Twitter Card tags
            updateMetaName('twitter:card', 'summary_large_image');
            updateMetaName('twitter:title', `${job.job_title} - Buch International Hospital`);
            updateMetaName('twitter:description', description);
        }
    }, [job]);

    useEffect(() => {
        if (resolvedParams.id) {
            fetchJob(resolvedParams.id);
            fetchOtherJobs(resolvedParams.id);
        }
    }, [resolvedParams.id]);

    const fetchJob = async (id: string) => {
        try {
            const res = await fetch(`/api/jobs/${id}`);
            if (res.ok) {
                const data = await res.json();
                setJob(data);
            } else {
                toast.error("Job not found");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOtherJobs = async (currentId: string) => {
        try {
            const res = await fetch(`/api/jobs`);
            if (res.ok) {
                const data: Job[] = await res.json();
                // Filter out current job and limit to 5
                const others = data.filter(j => j.id !== Number(currentId) && j.status === 'Active').slice(0, 5);
                setOtherJobs(others);
            }
        } catch (error) {
            console.error("Error fetching other jobs", error);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 max-w-6xl space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="container mx-auto py-12 text-center">
                <h2 className="text-xl font-semibold">Job not found</h2>
                <Link href="/jobs">
                    <Button variant="link">Back to all jobs</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Details */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">{job.job_title}</h1>
                        <div className="text-muted-foreground text-sm mb-4">
                            {job.location}
                            <span className="mx-2">•</span>
                            {job.type_of_employment}
                        </div>
                    </div>

                    <Card className="border-none shadow-sm">
                        <CardContent className="pt-6 space-y-8">
                            {/* Company Description */}
                            <section className="space-y-3">
                                <h3 className="text-lg font-semibold text-primary">Company Description</h3>
                                <div className="prose max-w-none text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                                    {job.company_description || "No description provided."}
                                </div>
                            </section>

                            {/* Qualifications */}
                            <section className="space-y-3">
                                <h3 className="text-lg font-semibold text-primary">Qualifications</h3>
                                <div className="prose max-w-none text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                                    {job.qualifications || "No specific qualifications listed."}
                                </div>
                            </section>

                            {/* Experience */}
                            <section className="space-y-3">
                                <h3 className="text-lg font-semibold text-primary">Additional Information</h3>
                                <div className="prose max-w-none text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                                    {job.experience || ""}
                                    {job.experience && job.additional_information ? "\n\n" : ""}
                                    {job.additional_information || ""}
                                    {(!job.experience && !job.additional_information) && "No additional information provided."}
                                </div>
                            </section>

                            {/* Actions (Bottom for Mobile / Extra CTA) */}
                            <div className="pt-4 lg:hidden">
                                <Link href={`/jobs/${resolvedParams.id}/apply`}>
                                    <Button className="w-full bg-[#167f39] hover:bg-[#12662d] text-white text-md py-6 mb-3">
                                        I&apos;m interested
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Sidebar */}
                <div className="space-y-8">

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Link href={`/jobs/${resolvedParams.id}/apply`}>
                            <Button className="w-full bg-[#167f39] hover:bg-[#12662d] text-white text-md py-6 rounded-sm shadow-sm uppercase font-semibold tracking-wide">
                                I&apos;m interested
                            </Button>
                        </Link>
                        <Link href={`/jobs/${resolvedParams.id}/refer`}>
                            <Button variant="outline" className="w-full bg-slate-50 text-slate-700 hover:bg-slate-100 text-md py-6 border-slate-200 rounded-sm shadow-sm">
                                Refer a friend
                            </Button>
                        </Link>
                    </div>

                    {/* Branding / Logo (Optional, using text header from screenshot) */}
                    <div className="hidden">
                        {/* Placeholder for Buch Logo if needed */}
                    </div>

                    {/* Share This Job */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Share this job</h4>
                        <div className="flex gap-2">
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-sm border-slate-300 text-slate-600 hover:text-white hover:bg-[#0077b5] hover:border-[#0077b5] transition-colors"
                                onClick={() => {
                                    const url = encodeURIComponent(window.location.href);
                                    const title = encodeURIComponent(`${job.job_title} at Buch International Hospital`);
                                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
                                }}
                            >
                                <Linkedin className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-sm border-slate-300 text-slate-600 hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] transition-colors"
                                onClick={() => {
                                    const url = encodeURIComponent(window.location.href);
                                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
                                }}
                            >
                                <Facebook className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-sm border-slate-300 text-slate-600 hover:text-white hover:bg-black hover:border-black transition-colors"
                                onClick={() => {
                                    const url = encodeURIComponent(window.location.href);
                                    const text = encodeURIComponent(`Check out this job: ${job.job_title} at Buch International Hospital`);
                                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
                                }}
                            >
                                <Twitter className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-sm border-slate-300 text-slate-600 hover:text-white hover:bg-slate-500 hover:border-slate-500 transition-colors"
                                onClick={() => {
                                    const subject = encodeURIComponent(`Job Opportunity: ${job.job_title} at Buch International Hospital`);
                                    const body = encodeURIComponent(`I thought you might be interested in this job opportunity:\n\n${job.job_title}\nLocation: ${job.location}\n\nApply here: ${window.location.href}`);
                                    window.location.href = `mailto:?subject=${subject}&body=${body}`;
                                }}
                            >
                                <Mail className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Other Jobs */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Other jobs at Buch Inte...</h4>
                        <div className="space-y-4">
                            {otherJobs.length > 0 ? (
                                otherJobs.map((otherJob) => (
                                    <Link href={`/jobs/${otherJob.id}`} key={otherJob.id} className="block group">
                                        <div className="text-[#0077b5] font-medium group-hover:underline text-sm truncate">
                                            {otherJob.job_title}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {otherJob.location}
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No other active jobs</p>
                            )}

                            {otherJobs.length > 0 && (
                                <Link href="/jobs" className="block text-xs text-[#0077b5] hover:underline mt-2">
                                    Show all jobs
                                </Link>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
