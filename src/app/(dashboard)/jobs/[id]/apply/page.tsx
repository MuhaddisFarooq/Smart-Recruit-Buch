"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, Briefcase, GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

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
                // Note: Fetching existing experience/education is not implemented in user API yet.
                // Assuming empty list for now, or we could fetch if we added GET endpoints for them.
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
                router.push(`/jobs`); // Redirect to job list or confirmation
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

    if (isFetchingUser) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Easy Apply</h1>
                <p className="text-muted-foreground">Autofill your application with your profile.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Resume Upload - Top as per design "Easy Apply" logic */}
                <Card>
                    <CardContent className="pt-6">
                        {resumeUrl ? (
                            <div className="border-2 border-dashed border-green-500/50 bg-green-50/50 rounded-lg p-8 text-center transition-colors">
                                <div className="flex flex-col items-center justify-center gap-2 text-green-600">
                                    <CheckIcon />
                                    <div className="text-sm font-medium">Resume uploaded (Linked)</div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setResumeUrl("")} className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <X className="w-4 h-4 mr-2" /> Remove Resume
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <label
                                htmlFor="resume-upload"
                                className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer group"
                            >
                                <div className="p-3 bg-muted rounded-full group-hover:bg-background transition-colors">
                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm font-medium text-foreground">
                                        Upload Resume
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <span className="text-primary font-medium hover:underline">Choose a file</span> or drop it here
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-1">10MB size limit</div>
                                </div>

                                <Input type="file" onChange={handleFileUpload} className="hidden" id="resume-upload" accept=".pdf,.doc,.docx" />
                            </label>
                        )}
                        {isUploading && <div className="mt-4 text-center text-xs text-muted-foreground animate-pulse">Uploading resume...</div>}
                        {isParsing && !isUploading && <div className="mt-4 text-center text-xs text-blue-600 animate-pulse">Analyzing resume content...</div>}
                    </CardContent>
                </Card>

                {/* Personal Info */}
                <Card>
                    <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <Input value={personalInfo.name} onChange={e => setPersonalInfo({ ...personalInfo, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input value={personalInfo.email} onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })} required type="email" />
                        </div>
                        <div className="space-y-2">
                            <Label>City *</Label>
                            <Input value={personalInfo.city} onChange={e => setPersonalInfo({ ...personalInfo, city: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number *</Label>
                            <Input value={personalInfo.phone} onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })} required />
                        </div>
                    </CardContent>
                </Card>

                {/* Experience */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Experience</CardTitle>
                        {!showAddEx && <Button type="button" onClick={() => setShowAddEx(true)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {experienceList.map((ex, idx) => (
                            <div key={idx} className="border p-4 rounded-md relative group">
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => setExperienceList(experienceList.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                <h4 className="font-semibold">{ex.title}</h4>
                                <p className="text-sm text-muted-foreground">{ex.company} • {ex.location}</p>
                                <p className="text-xs text-muted-foreground">{ex.startDate} - {ex.isCurrent ? 'Present' : ex.endDate}</p>
                            </div>
                        ))}

                        {showAddEx && (
                            <div className="border p-4 rounded-md space-y-4 bg-muted/50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Title *</Label><Input value={newEx.title} onChange={e => setNewEx({ ...newEx, title: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Company *</Label><Input value={newEx.company} onChange={e => setNewEx({ ...newEx, company: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Location</Label><Input value={newEx.location} onChange={e => setNewEx({ ...newEx, location: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Description</Label><Input value={newEx.description} onChange={e => setNewEx({ ...newEx, description: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>From *</Label><Input type="date" value={newEx.startDate} onChange={e => setNewEx({ ...newEx, startDate: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>To {newEx.isCurrent ? '(Present)' : '*'}</Label><Input type="date" disabled={newEx.isCurrent} value={newEx.endDate} onChange={e => setNewEx({ ...newEx, endDate: e.target.value })} /></div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="curr-work" checked={newEx.isCurrent} onCheckedChange={(c) => setNewEx({ ...newEx, isCurrent: !!c })} />
                                    <Label htmlFor="curr-work">I currently work here</Label>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowAddEx(false)}>Cancel</Button>
                                    <Button type="button" onClick={addExperience} disabled={!newEx.title || !newEx.company || !newEx.startDate}>Save</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Education */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Education</CardTitle>
                        {!showAddEdu && <Button type="button" onClick={() => setShowAddEdu(true)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {educationList.map((ed, idx) => (
                            <div key={idx} className="border p-4 rounded-md relative group">
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => setEducationList(educationList.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                <h4 className="font-semibold">{ed.institution}</h4>
                                <p className="text-sm text-muted-foreground">{ed.degree} in {ed.major}</p>
                                <p className="text-xs text-muted-foreground">{ed.startDate} - {ed.isCurrent ? 'Present' : ed.endDate}</p>
                            </div>
                        ))}

                        {showAddEdu && (
                            <div className="border p-4 rounded-md space-y-4 bg-muted/50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Institution *</Label><Input value={newEdu.institution} onChange={e => setNewEdu({ ...newEdu, institution: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Major</Label><Input value={newEdu.major} onChange={e => setNewEdu({ ...newEdu, major: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Degree</Label><Input value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Location</Label><Input value={newEdu.location} onChange={e => setNewEdu({ ...newEdu, location: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>From *</Label><Input type="date" value={newEdu.startDate} onChange={e => setNewEdu({ ...newEdu, startDate: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>To {newEdu.isCurrent ? '(Present)' : '*'}</Label><Input type="date" disabled={newEdu.isCurrent} value={newEdu.endDate} onChange={e => setNewEdu({ ...newEdu, endDate: e.target.value })} /></div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="curr-edu" checked={newEdu.isCurrent} onCheckedChange={(c) => setNewEdu({ ...newEdu, isCurrent: !!c })} />
                                    <Label htmlFor="curr-edu">I currently attend</Label>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowAddEdu(false)}>Cancel</Button>
                                    <Button type="button" onClick={addEducation} disabled={!newEdu.institution || !newEdu.startDate}>Save</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Socials */}
                <Card>
                    <CardHeader><CardTitle>Your Profiles</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>LinkedIn</Label><Input value={socialLinks.linkedin} onChange={e => setSocialLinks({ ...socialLinks, linkedin: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Facebook</Label><Input value={socialLinks.facebook} onChange={e => setSocialLinks({ ...socialLinks, facebook: e.target.value })} /></div>
                        <div className="space-y-2"><Label>X (Twitter)</Label><Input value={socialLinks.twitter} onChange={e => setSocialLinks({ ...socialLinks, twitter: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Website</Label><Input value={socialLinks.website} onChange={e => setSocialLinks({ ...socialLinks, website: e.target.value })} /></div>
                    </CardContent>
                </Card>

                {/* Message */}
                <Card>
                    <CardHeader><CardTitle>Message to Hiring Team</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>Let the company know about your interest</Label>
                            <Textarea value={message} onChange={e => setMessage(e.target.value)} className="min-h-[120px]" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]">
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Submit Application"}
                    </Button>
                </div>

            </form>
        </div>
    );
}

function CheckIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
    )
}
