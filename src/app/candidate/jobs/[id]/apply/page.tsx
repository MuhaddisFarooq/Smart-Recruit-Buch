"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, Briefcase, GraduationCap, X, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type Experience = {
    title: string;
    company: string;
    location: string;
    description: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
};

type Education = {
    institution: string;
    major: string;
    degree: string;
    location: string;
    description: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
};

const CUSTOM_GREEN = "#b9d36c";
const CUSTOM_GREEN_BG = "bg-[#b9d36c]";
const CUSTOM_GREEN_TEXT = "text-[#b9d36c]";
const CUSTOM_GREEN_BORDER = "border-[#b9d36c]";
const CUSTOM_GREEN_HOVER = "hover:bg-[#a3bd5b]";

export default function ApplyJobPage() {
    const router = useRouter();
    const params = useParams(); // { id: string }
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingUser, setIsFetchingUser] = useState(true);

    // Form State
    const [personalInfo, setPersonalInfo] = useState({
        name: "",
        email: "",
        city: "",
        phone: "",
    });

    const [socialLinks, setSocialLinks] = useState({
        linkedin: "",
        facebook: "",
        twitter: "",
        website: "",
    });

    const [experienceList, setExperienceList] = useState<Experience[]>([]);
    const [educationList, setEducationList] = useState<Education[]>([]);
    const [resumeUrl, setResumeUrl] = useState("");
    const [message, setMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    // New Entry State (for "Add" forms)
    const [showAddEx, setShowAddEx] = useState(false);
    const [newEx, setNewEx] = useState<Experience>({
        title: "", company: "", location: "", description: "", startDate: "", endDate: "", isCurrent: false
    });

    const [showAddEdu, setShowAddEdu] = useState(false);
    const [newEdu, setNewEdu] = useState<Education>({
        institution: "", major: "", degree: "", location: "", description: "", startDate: "", endDate: "", isCurrent: false
    });

    useEffect(() => {
        if (session?.user) {
            fetchUserData((session.user as any).id);
        } else {
            setIsFetchingUser(false);
        }
    }, [session]);

    const fetchUserData = async (userId: string) => {
        try {
            const res = await fetch(`/api/users/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setPersonalInfo({
                    name: data.name || "",
                    email: data.email || "",
                    city: data.city || "",
                    phone: data.phone || "",
                });
                setSocialLinks({
                    linkedin: data.linkedin_url || "",
                    facebook: data.facebook_url || "",
                    twitter: data.twitter_url || "",
                    website: data.website_url || "",
                });
                if (data.resume_url) setResumeUrl(data.resume_url);
            }
        } catch (error) {
            console.error("Failed to fetch user data", error);
        } finally {
            setIsFetchingUser(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size exceeds 10MB limit");
            return;
        }

        setIsUploading(true);
        setIsParsing(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Parallel Upload and Parse
            const uploadPromise = fetch("/api/uploads?folder=resumes", {
                method: "POST",
                body: formData,
            });

            const parsePromise = fetch("/api/parse-resume", {
                method: "POST",
                body: formData,
            });

            const [uploadRes, parseRes] = await Promise.all([uploadPromise, parsePromise]);

            // Handle Upload Result
            if (uploadRes.ok) {
                const data = await uploadRes.json();
                setResumeUrl(data.url);
                toast.success("Resume uploaded successfully");
            } else {
                toast.error("Failed to upload resume file");
            }

            // Handle Parse Result
            if (parseRes.ok) {
                const parseData = await parseRes.json();
                if (parseData.success && parseData.data) {
                    const { personalInfo: pi, socialLinks: sl, experience: exp, education: edu } = parseData.data;

                    if (pi) {
                        setPersonalInfo(prev => ({
                            ...prev,
                            name: pi.name || prev.name,
                            email: pi.email || prev.email,
                            phone: pi.phone || prev.phone,
                            city: pi.city || prev.city
                        }));
                    }
                    if (sl) {
                        setSocialLinks(prev => ({
                            ...prev,
                            linkedin: sl.linkedin || prev.linkedin,
                            facebook: sl.facebook || prev.facebook,
                            twitter: sl.twitter || prev.twitter,
                            website: sl.website || prev.website
                        }));
                    }
                    if (Array.isArray(exp) && exp.length > 0) setExperienceList(exp);
                    if (Array.isArray(edu) && edu.length > 0) setEducationList(edu);

                    toast.success("Resume parsed and form auto-filled!");
                }
            } else {
                console.warn("Resume parsing failed, but upload succeeded.");
            }

        } catch (error) {
            console.error("Upload/Parse error", error);
            toast.error("Error processing resume");
        } finally {
            setIsUploading(false);
            setIsParsing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            personalInfo,
            experience: experienceList,
            education: educationList,
            socialLinks,
            resumeUrl,
            message
        };

        try {
            const res = await fetch(`/api/jobs/${params.id}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Application submitted successfully!");
                router.push(`/candidate/jobs`); // Redirect to candidate job list
            } else {
                const err = await res.json();
                toast.error(err.error || "Submission failed");
            }
        } catch (error) {
            console.error("Submit error", error);
            toast.error("Error submitting application");
        } finally {
            setIsLoading(false);
        }
    };

    const addExperience = () => {
        setExperienceList([...experienceList, newEx]);
        setNewEx({ title: "", company: "", location: "", description: "", startDate: "", endDate: "", isCurrent: false });
        setShowAddEx(false);
    };

    const addEducation = () => {
        setEducationList([...educationList, newEdu]);
        setNewEdu({ institution: "", major: "", degree: "", location: "", description: "", startDate: "", endDate: "", isCurrent: false });
        setShowAddEdu(false);
    };

    if (isFetchingUser) return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-4 ${CUSTOM_GREEN_BORDER}`}></div>
        </div>
    );

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

            <div className="relative z-10 container max-w-4xl mx-auto py-12 px-4 md:px-6">
                {/* Back Link */}
                <Link
                    href={`/candidate/jobs/${params.id}`}
                    className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors group"
                >
                    <div className="bg-white/10 p-2 rounded-full mr-3 group-hover:bg-white/20 transition-all">
                        <ArrowLeft className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-medium">Back to Job Details</span>
                </Link>

                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-100">
                    <div className="md:p-10 p-6 space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold text-neutral-800 mb-2">Easy Apply</h1>
                            <p className="text-lg text-neutral-500">Autofill your application with your profile in seconds.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Resume Upload */}
                            <Card className="border-neutral-200 shadow-sm">
                                <CardContent className="pt-6">
                                    {resumeUrl ? (
                                        <div className={`border-2 border-dashed ${CUSTOM_GREEN_BORDER}/50 bg-[#b9d36c]/5 rounded-xl p-8 text-center transition-colors`}>
                                            <div className={`flex flex-col items-center justify-center gap-3 ${CUSTOM_GREEN_TEXT}`}>
                                                <CheckCircle2 className="h-10 w-10" />
                                                <div className="text-lg font-semibold text-neutral-700">Resume attached</div>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setResumeUrl("")} className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                    <X className="w-4 h-4 mr-2" /> Remove Resume
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="resume-upload"
                                            className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed border-neutral-200 rounded-xl p-12 text-center hover:bg-neutral-50 hover:border-[#b9d36c]/50 transition-all cursor-pointer group`}
                                        >
                                            <div className="p-4 bg-neutral-100 rounded-full group-hover:bg-[#b9d36c]/10 transition-colors">
                                                <Upload className="w-8 h-8 text-neutral-400 group-hover:text-[#b9d36c]" />
                                            </div>

                                            <div className="space-y-1">
                                                <div className="text-lg font-semibold text-neutral-700">
                                                    Upload Resume
                                                </div>
                                                <div className="text-sm text-neutral-500">
                                                    <span className={`${CUSTOM_GREEN_TEXT} font-medium hover:underline`}>Choose a file</span> or drop it here
                                                </div>
                                                <div className="text-xs text-neutral-400 mt-2">PDF, DOC, DOCX (Max 10MB)</div>
                                            </div>

                                            <Input type="file" onChange={handleFileUpload} className="hidden" id="resume-upload" accept=".pdf,.doc,.docx" />
                                        </label>
                                    )}
                                    {isUploading && <div className={`mt-4 text-center text-sm ${CUSTOM_GREEN_TEXT} font-medium animate-pulse`}>Uploading resume...</div>}
                                    {isParsing && !isUploading && <div className="mt-4 text-center text-sm text-blue-600 animate-pulse font-medium">AI is analyzing your resume content...</div>}
                                </CardContent>
                            </Card>

                            {/* Personal Info */}
                            <Card className="border-neutral-200 shadow-sm">
                                <CardHeader><CardTitle className="text-xl">Personal Information</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-base">Full Name *</Label>
                                        <Input className="h-12 text-base" value={personalInfo.name} onChange={e => setPersonalInfo({ ...personalInfo, name: e.target.value })} required />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-base">Email *</Label>
                                        <Input className="h-12 text-base" value={personalInfo.email} onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })} required type="email" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-base">City *</Label>
                                        <Input className="h-12 text-base" value={personalInfo.city} onChange={e => setPersonalInfo({ ...personalInfo, city: e.target.value })} required />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-base">Phone Number *</Label>
                                        <Input className="h-12 text-base" value={personalInfo.phone} onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })} required />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Experience */}
                            <Card className="border-neutral-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-xl"><Briefcase className={`w-6 h-6 ${CUSTOM_GREEN_TEXT}`} /> Experience</CardTitle>
                                    {!showAddEx && <Button type="button" onClick={() => setShowAddEx(true)} variant="outline" size="sm" className="border-neutral-300 hover:bg-neutral-50"><Plus className="w-4 h-4 mr-1" /> Add</Button>}
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {experienceList.map((ex, idx) => (
                                        <div key={idx} className="border border-neutral-200 p-5 rounded-xl relative group hover:shadow-sm transition-all bg-neutral-50/50">
                                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => setExperienceList(experienceList.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                            <h4 className="font-bold text-lg text-neutral-800">{ex.title}</h4>
                                            <p className="text-base text-neutral-600">{ex.company} • {ex.location}</p>
                                            <p className="text-sm text-neutral-500 mt-1">{ex.startDate} - {ex.isCurrent ? 'Present' : ex.endDate}</p>
                                        </div>
                                    ))}

                                    {showAddEx && (
                                        <div className="border border-neutral-200 p-6 rounded-xl space-y-4 bg-neutral-50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Title *</Label><Input value={newEx.title} onChange={e => setNewEx({ ...newEx, title: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>Company *</Label><Input value={newEx.company} onChange={e => setNewEx({ ...newEx, company: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>Location</Label><Input value={newEx.location} onChange={e => setNewEx({ ...newEx, location: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>From *</Label><Input type="date" value={newEx.startDate} onChange={e => setNewEx({ ...newEx, startDate: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>To {newEx.isCurrent ? '(Present)' : '*'}</Label><Input type="date" disabled={newEx.isCurrent} value={newEx.endDate} onChange={e => setNewEx({ ...newEx, endDate: e.target.value })} /></div>
                                            </div>
                                            <div className="space-y-2"><Label>Description</Label><Textarea value={newEx.description} onChange={e => setNewEx({ ...newEx, description: e.target.value })} className="h-20" /></div>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <Checkbox id="curr-work" className={`data-[state=checked]:${CUSTOM_GREEN_BG} border-neutral-300`} checked={newEx.isCurrent} onCheckedChange={(c) => setNewEx({ ...newEx, isCurrent: !!c })} />
                                                <Label htmlFor="curr-work">I currently work here</Label>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4">
                                                <Button type="button" variant="ghost" onClick={() => setShowAddEx(false)}>Cancel</Button>
                                                <Button type="button" className={`${CUSTOM_GREEN_BG} text-neutral-900 font-semibold hover:opacity-90`} onClick={addExperience} disabled={!newEx.title || !newEx.company || !newEx.startDate}>Save Experience</Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Education */}
                            <Card className="border-neutral-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-xl"><GraduationCap className={`w-6 h-6 ${CUSTOM_GREEN_TEXT}`} /> Education</CardTitle>
                                    {!showAddEdu && <Button type="button" onClick={() => setShowAddEdu(true)} variant="outline" size="sm" className="border-neutral-300 hover:bg-neutral-50"><Plus className="w-4 h-4 mr-1" /> Add</Button>}
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {educationList.map((ed, idx) => (
                                        <div key={idx} className="border border-neutral-200 p-5 rounded-xl relative group hover:shadow-sm transition-all bg-neutral-50/50">
                                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => setEducationList(educationList.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                            <h4 className="font-bold text-lg text-neutral-800">{ed.institution}</h4>
                                            <p className="text-base text-neutral-600">{ed.degree} in {ed.major}</p>
                                            <p className="text-sm text-neutral-500 mt-1">{ed.startDate} - {ed.isCurrent ? 'Present' : ed.endDate}</p>
                                        </div>
                                    ))}

                                    {showAddEdu && (
                                        <div className="border border-neutral-200 p-6 rounded-xl space-y-4 bg-neutral-50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Institution *</Label><Input value={newEdu.institution} onChange={e => setNewEdu({ ...newEdu, institution: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>Major</Label><Input value={newEdu.major} onChange={e => setNewEdu({ ...newEdu, major: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>Degree</Label><Input value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>Location</Label><Input value={newEdu.location} onChange={e => setNewEdu({ ...newEdu, location: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>From *</Label><Input type="date" value={newEdu.startDate} onChange={e => setNewEdu({ ...newEdu, startDate: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>To {newEdu.isCurrent ? '(Present)' : '*'}</Label><Input type="date" disabled={newEdu.isCurrent} value={newEdu.endDate} onChange={e => setNewEdu({ ...newEdu, endDate: e.target.value })} /></div>
                                            </div>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <Checkbox id="curr-edu" className={`data-[state=checked]:${CUSTOM_GREEN_BG} border-neutral-300`} checked={newEdu.isCurrent} onCheckedChange={(c) => setNewEdu({ ...newEdu, isCurrent: !!c })} />
                                                <Label htmlFor="curr-edu">I currently attend</Label>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4">
                                                <Button type="button" variant="ghost" onClick={() => setShowAddEdu(false)}>Cancel</Button>
                                                <Button type="button" className={`${CUSTOM_GREEN_BG} text-neutral-900 font-semibold hover:opacity-90`} onClick={addEducation} disabled={!newEdu.institution || !newEdu.startDate}>Save Education</Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Socials */}
                            <Card className="border-neutral-200 shadow-sm">
                                <CardHeader><CardTitle className="text-xl">Your Profiles</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label>LinkedIn</Label><Input value={socialLinks.linkedin} onChange={e => setSocialLinks({ ...socialLinks, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." /></div>
                                    <div className="space-y-2"><Label>Facebook</Label><Input value={socialLinks.facebook} onChange={e => setSocialLinks({ ...socialLinks, facebook: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>X (Twitter)</Label><Input value={socialLinks.twitter} onChange={e => setSocialLinks({ ...socialLinks, twitter: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Website</Label><Input value={socialLinks.website} onChange={e => setSocialLinks({ ...socialLinks, website: e.target.value })} /></div>
                                </CardContent>
                            </Card>

                            {/* Message */}
                            <Card className="border-neutral-200 shadow-sm">
                                <CardHeader><CardTitle className="text-xl">Message to Hiring Team</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <Label className="text-base">Let the company know about your interest</Label>
                                        <Textarea value={message} onChange={e => setMessage(e.target.value)} className="min-h-[160px] text-base" placeholder="Briefly introduce yourself..." />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-4 pt-4 pb-8">
                                <Button type="button" variant="outline" size="lg" onClick={() => router.back()} className="text-base border-neutral-300">Cancel</Button>
                                <Button type="submit" disabled={isLoading} size="lg" className={`${CUSTOM_GREEN_BG} ${CUSTOM_GREEN_HOVER} text-neutral-900 font-bold min-w-[240px] text-lg shadow-lg`}>
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Submit Application"}
                                </Button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
