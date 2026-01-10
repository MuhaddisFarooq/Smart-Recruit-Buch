"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle2, User, Mail, Phone, Users, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type Job = {
    id: number;
    job_title: string;
    location: string;
    type_of_employment: string;
};

const RELATIONSHIP_OPTIONS = [
    "Colleague",
    "Friend",
    "Family Member",
    "Former Coworker",
    "Professional Contact",
    "Other"
];

// Custom green color class
const CUSTOM_GREEN = "text-[#b9d36c]";
const CUSTOM_GREEN_BG = "bg-[#b9d36c]";
const CUSTOM_GREEN_BORDER = "border-[#b9d36c]";
const CUSTOM_GREEN_HOVER = "hover:bg-[#a3bd5b]"; // Slightly darker for hover

export default function ReferFriendPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { data: session } = useSession();
    const resolvedParams = use(params);
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [referralInfo, setReferralInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        confirmEmail: "",
        phone: "",
        relationship: "",
        recommendation: ""
    });
    const [referralResumeUrl, setReferralResumeUrl] = useState("");

    const [referrerInfo, setReferrerInfo] = useState({
        firstName: "",
        lastName: "",
        email: ""
    });

    const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
    const [privacyConfirmed, setPrivacyConfirmed] = useState(false);

    useEffect(() => {
        fetchJob();
    }, [resolvedParams.id]);

    useEffect(() => {
        // Pre-fill referrer info from session
        if (session?.user) {
            const nameParts = (session.user.name || "").split(" ");
            setReferrerInfo({
                firstName: nameParts[0] || "",
                lastName: nameParts.slice(1).join(" ") || "",
                email: session.user.email || ""
            });
        }
    }, [session]);

    const fetchJob = async () => {
        try {
            const res = await fetch(`/api/jobs/${resolvedParams.id}`);
            if (res.ok) {
                const data = await res.json();
                setJob(data);
            }
        } catch (error) {
            console.error("Error fetching job:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 10MB limit
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/uploads?folder=resumes", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setReferralResumeUrl(data.url);
                toast.success("Resume uploaded successfully");
            } else {
                toast.error("Failed to upload resume");
            }
        } catch (error) {
            console.error("Upload error", error);
            toast.error("Upload error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!referralInfo.firstName || !referralInfo.lastName || !referralInfo.email) {
            toast.error("Please fill in all required referral fields");
            return;
        }
        if (referralInfo.email !== referralInfo.confirmEmail) {
            toast.error("Referral emails do not match");
            return;
        }
        if (!referralInfo.relationship) {
            toast.error("Please select how you know this person");
            return;
        }
        if (!referrerInfo.firstName || !referrerInfo.lastName || !referrerInfo.email) {
            toast.error("Please fill in your details");
            return;
        }
        if (!authorizationConfirmed || !privacyConfirmed) {
            toast.error("Please confirm the authorization and privacy checkboxes");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/jobs/${resolvedParams.id}/refer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    referralFirstName: referralInfo.firstName,
                    referralLastName: referralInfo.lastName,
                    referralEmail: referralInfo.email,
                    referralPhone: referralInfo.phone,
                    relationship: referralInfo.relationship,
                    recommendation: referralInfo.recommendation,
                    referralResumeUrl,
                    referrerFirstName: referrerInfo.firstName,
                    referrerLastName: referrerInfo.lastName,
                    referrerEmail: referrerInfo.email
                })
            });

            if (res.ok) {
                toast.success("Referral submitted successfully!");
                router.push(`/candidate/jobs/${resolvedParams.id}`);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to submit referral");
            }
        } catch (error) {
            console.error("Submit error:", error);
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

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
                    backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop")', // Professional office background
                }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 container max-w-4xl mx-auto py-12 px-4 md:px-6">

                {/* Back Link */}
                <Link
                    href={`/candidate/jobs/${resolvedParams.id}`}
                    className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors group"
                >
                    <div className="bg-white/10 p-2 rounded-full mr-3 group-hover:bg-white/20 transition-all">
                        <ArrowLeft className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-medium">Back to Job Details</span>
                </Link>

                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-100">

                    {/* Header Section */}
                    <div className="bg-neutral-50 p-10 border-b border-neutral-100">
                        <h1 className="text-4xl md:text-5xl font-bold text-neutral-800 mb-4 tracking-tight">Refer a Friend</h1>
                        <p className="text-xl text-neutral-500 font-light">
                            Know someone perfect for the <span className={`font-semibold text-neutral-800`}>{job?.job_title}</span> role?
                        </p>
                    </div>

                    <div className="p-10 space-y-12">

                        {/* Section 1: Referral Info */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-3 rounded-xl ${CUSTOM_GREEN_BG}/10`}>
                                    <User className={`h-8 w-8 ${CUSTOM_GREEN}`} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-neutral-800">Who are you referring?</h2>
                                    <p className="text-neutral-500">Please provide their contact details below.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold text-neutral-700">First Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        className="h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-[#b9d36c] focus:ring-[#b9d36c]/20"
                                        value={referralInfo.firstName}
                                        onChange={(e) => setReferralInfo({ ...referralInfo, firstName: e.target.value })}
                                        placeholder="Jane"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold text-neutral-700">Last Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        className="h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-[#b9d36c] focus:ring-[#b9d36c]/20"
                                        value={referralInfo.lastName}
                                        onChange={(e) => setReferralInfo({ ...referralInfo, lastName: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold text-neutral-700">Email Address <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="email"
                                        className="h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-[#b9d36c] focus:ring-[#b9d36c]/20"
                                        value={referralInfo.email}
                                        onChange={(e) => setReferralInfo({ ...referralInfo, email: e.target.value })}
                                        placeholder="jane.doe@example.com"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold text-neutral-700">Confirm Email <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="email"
                                        className="h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-[#b9d36c] focus:ring-[#b9d36c]/20"
                                        value={referralInfo.confirmEmail}
                                        onChange={(e) => setReferralInfo({ ...referralInfo, confirmEmail: e.target.value })}
                                        placeholder="Confirm email address"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold text-neutral-700">Phone Number</Label>
                                    <Input
                                        className="h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-[#b9d36c] focus:ring-[#b9d36c]/20"
                                        value={referralInfo.phone}
                                        onChange={(e) => setReferralInfo({ ...referralInfo, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold text-neutral-700">Relationship <span className="text-red-500">*</span></Label>
                                    <Select value={referralInfo.relationship} onValueChange={(v) => setReferralInfo({ ...referralInfo, relationship: v })}>
                                        <SelectTrigger className="h-14 text-lg bg-neutral-50 border-neutral-200 focus:ring-[#b9d36c]/20">
                                            <SelectValue placeholder="How do you know them?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {RELATIONSHIP_OPTIONS.map(opt => (
                                                <SelectItem key={opt} value={opt} className="text-base py-3">{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-base font-semibold text-neutral-700">Why do you recommend them? <span className="text-red-500">*</span></Label>
                                <Textarea
                                    className="min-h-[160px] text-lg bg-neutral-50 border-neutral-200 focus:border-[#b9d36c] focus:ring-[#b9d36c]/20 resize-none p-4"
                                    value={referralInfo.recommendation}
                                    onChange={(e) => setReferralInfo({ ...referralInfo, recommendation: e.target.value })}
                                    placeholder="Share why they would be a great fit for this role..."
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-base font-semibold text-neutral-700">Resume / CV</Label>
                                {referralResumeUrl ? (
                                    <div className={`border-2 border-dashed ${CUSTOM_GREEN_BORDER} bg-[#b9d36c]/5 rounded-xl p-8 text-center transition-all`}>
                                        <div className="bg-[#b9d36c]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 className={`h-8 w-8 ${CUSTOM_GREEN}`} />
                                        </div>
                                        <p className="text-lg font-medium text-neutral-800 mb-2">Resume uploaded successfully</p>
                                        <Button variant="link" onClick={() => setReferralResumeUrl("")} className="text-red-500 hover:text-red-600 font-medium">
                                            Remove and upload different file
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="group border-2 border-dashed border-neutral-300 rounded-xl p-10 text-center cursor-pointer hover:border-[#b9d36c] hover:bg-[#b9d36c]/5 transition-all block">
                                        <div className="bg-neutral-100 group-hover:bg-[#b9d36c]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                                            <Upload className="h-8 w-8 text-neutral-400 group-hover:text-[#b9d36c]" />
                                        </div>
                                        <p className="text-lg font-medium text-neutral-700 mb-1">
                                            <span className={`${CUSTOM_GREEN}`}>Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-neutral-500">PDF, DOC, or DOCX (Max 10MB)</p>
                                        <Input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx" />
                                    </label>
                                )}
                                {isUploading && <p className={`text-center ${CUSTOM_GREEN} animate-pulse font-medium mt-2`}>Uploading resume...</p>}
                            </div>
                        </section>

                        <div className="h-px bg-neutral-100 my-8"></div>

                        {/* Section 2: Referrer Info */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-3 rounded-xl ${CUSTOM_GREEN_BG}/10`}>
                                    <Users className={`h-8 w-8 ${CUSTOM_GREEN}`} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-neutral-800">Your Information</h2>
                                    <p className="text-neutral-500">So we know who to thank for this referral.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold text-neutral-700">Your First Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        className="h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-[#b9d36c] focus:ring-[#b9d36c]/20"
                                        value={referrerInfo.firstName}
                                        onChange={(e) => setReferrerInfo({ ...referrerInfo, firstName: e.target.value })}
                                        placeholder="Your first name"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold text-neutral-700">Your Last Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        className="h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-[#b9d36c] focus:ring-[#b9d36c]/20"
                                        value={referrerInfo.lastName}
                                        onChange={(e) => setReferrerInfo({ ...referrerInfo, lastName: e.target.value })}
                                        placeholder="Your last name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-base font-semibold text-neutral-700">Your Email <span className="text-red-500">*</span></Label>
                                <Input
                                    type="email"
                                    className="h-14 text-lg bg-neutral-50 border-neutral-200 focus:border-[#b9d36c] focus:ring-[#b9d36c]/20"
                                    value={referrerInfo.email}
                                    onChange={(e) => setReferrerInfo({ ...referrerInfo, email: e.target.value })}
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <div className="bg-neutral-50 rounded-xl p-6 space-y-4 border border-neutral-100">
                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        id="authorization"
                                        className={`mt-1 h-5 w-5 border-neutral-300 data-[state=checked]:${CUSTOM_GREEN_BG} data-[state=checked]:border-[#b9d36c]`}
                                        checked={authorizationConfirmed}
                                        onCheckedChange={(checked) => setAuthorizationConfirmed(checked as boolean)}
                                    />
                                    <label htmlFor="authorization" className="text-base text-neutral-600 leading-relaxed cursor-pointer">
                                        I confirm that I have obtained consent from the person I am referring to share their personal information for recruitment purposes. <span className="text-red-500">*</span>
                                    </label>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        id="privacy"
                                        className={`mt-1 h-5 w-5 border-neutral-300 data-[state=checked]:${CUSTOM_GREEN_BG} data-[state=checked]:border-[#b9d36c]`}
                                        checked={privacyConfirmed}
                                        onCheckedChange={(checked) => setPrivacyConfirmed(checked as boolean)}
                                    />
                                    <label htmlFor="privacy" className="text-base text-neutral-600 leading-relaxed cursor-pointer">
                                        I understand that submitting this form will process personal data in accordance with the company's privacy policy. <span className="text-red-500">*</span>
                                    </label>
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-end pt-6">
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`px-12 py-8 text-xl font-semibold text-neutral-800 ${CUSTOM_GREEN_BG} ${CUSTOM_GREEN_HOVER} shadow-lg hover:shadow-xl transition-all w-full md:w-auto`}
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">Processing...</span>
                                ) : (
                                    <span className="flex items-center gap-2">Submit Referral <Send className="h-5 w-5" /></span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer simple copyright/branding */}
                <div className="mt-8 text-center text-white/60 text-sm">
                    &copy; {new Date().getFullYear()} Buch International Hospital. All rights reserved.
                </div>
            </div>
        </div>
    );
}
