"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
                router.push(`/jobs/${resolvedParams.id}`);
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Back Link */}
            <Link href={`/jobs/${resolvedParams.id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Job
            </Link>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Refer a Friend</h1>
                <p className="text-muted-foreground">
                    Refer someone you know for: <span className="font-semibold text-foreground">{job?.job_title}</span>
                </p>
            </div>

            {/* About Your Referral */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">About your referral</CardTitle>
                    <p className="text-sm text-muted-foreground">First, please enter some details about your referral</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First name <span className="text-red-500">*</span></Label>
                            <Input
                                value={referralInfo.firstName}
                                onChange={(e) => setReferralInfo({ ...referralInfo, firstName: e.target.value })}
                                placeholder="First name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Last name <span className="text-red-500">*</span></Label>
                            <Input
                                value={referralInfo.lastName}
                                onChange={(e) => setReferralInfo({ ...referralInfo, lastName: e.target.value })}
                                placeholder="Last name"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Email <span className="text-red-500">*</span></Label>
                            <Input
                                type="email"
                                value={referralInfo.email}
                                onChange={(e) => setReferralInfo({ ...referralInfo, email: e.target.value })}
                                placeholder="Email address"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm email <span className="text-red-500">*</span></Label>
                            <Input
                                type="email"
                                value={referralInfo.confirmEmail}
                                onChange={(e) => setReferralInfo({ ...referralInfo, confirmEmail: e.target.value })}
                                placeholder="Confirm email"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Phone number</Label>
                            <Input
                                value={referralInfo.phone}
                                onChange={(e) => setReferralInfo({ ...referralInfo, phone: e.target.value })}
                                placeholder="Phone number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>How do you know this person? <span className="text-red-500">*</span></Label>
                            <Select value={referralInfo.relationship} onValueChange={(v) => setReferralInfo({ ...referralInfo, relationship: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Please select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RELATIONSHIP_OPTIONS.map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Recommendation <span className="text-red-500">*</span></Label>
                        <Textarea
                            value={referralInfo.recommendation}
                            onChange={(e) => setReferralInfo({ ...referralInfo, recommendation: e.target.value })}
                            placeholder="Why do you recommend this person for this role?"
                            rows={4}
                        />
                    </div>

                    {/* Resume Upload */}
                    <div className="space-y-2">
                        <Label>Resume</Label>
                        {referralResumeUrl ? (
                            <div className="border-2 border-dashed border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <p className="text-sm text-green-700 dark:text-green-400">Resume uploaded</p>
                                <Button variant="link" size="sm" onClick={() => setReferralResumeUrl("")} className="text-red-500">
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors block">
                                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="text-primary font-medium">Browse resume</span> or just drop it here
                                </p>
                                <Input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx" />
                            </label>
                        )}
                        {isUploading && <p className="text-sm text-muted-foreground animate-pulse text-center">Uploading...</p>}
                    </div>
                </CardContent>
            </Card>

            {/* About You */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">About you</CardTitle>
                    <p className="text-sm text-muted-foreground">Next, please enter your contact information to let the recruiting team know who is the referrer</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Your first name <span className="text-red-500">*</span></Label>
                            <Input
                                value={referrerInfo.firstName}
                                onChange={(e) => setReferrerInfo({ ...referrerInfo, firstName: e.target.value })}
                                placeholder="Your first name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Your last name <span className="text-red-500">*</span></Label>
                            <Input
                                value={referrerInfo.lastName}
                                onChange={(e) => setReferrerInfo({ ...referrerInfo, lastName: e.target.value })}
                                placeholder="Your last name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Your email <span className="text-red-500">*</span></Label>
                        <Input
                            type="email"
                            value={referrerInfo.email}
                            onChange={(e) => setReferrerInfo({ ...referrerInfo, email: e.target.value })}
                            placeholder="Your email"
                        />
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3 pt-4">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="authorization"
                                checked={authorizationConfirmed}
                                onCheckedChange={(checked) => setAuthorizationConfirmed(checked as boolean)}
                            />
                            <label htmlFor="authorization" className="text-sm text-muted-foreground leading-tight">
                                You confirm having received authorization to forward the above-mentioned information from the referral. <span className="text-red-500">*</span>
                            </label>
                        </div>

                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="privacy"
                                checked={privacyConfirmed}
                                onCheckedChange={(checked) => setPrivacyConfirmed(checked as boolean)}
                            />
                            <label htmlFor="privacy" className="text-sm text-muted-foreground leading-tight">
                                Please be informed that by submitting this form you will trigger some processing of your personal data by the recruiting company. <span className="text-red-500">*</span>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
                <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-12 py-6 text-lg"
                >
                    {submitting ? "Submitting..." : "Submit"}
                </Button>
            </div>
        </div>
    );
}
