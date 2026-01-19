"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Plus, Trash2, FileText, CheckCircle2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

// --- Types ---
type Experience = {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
};

type Education = {
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
};

type CandidateForm = {
    // Brief
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    sourceType: string;
    source: string;
    jobId: string;
    photoUrl: string;
    resumeUrl: string;

    // Arrays
    experience: Experience[];
    education: Education[];

    // Additional
    tags: string[];
    notes: string;
};

const INITIAL_FORM: CandidateForm = {
    firstName: "", lastName: "", email: "", phone: "", location: "", website: "",
    sourceType: "", source: "", jobId: "", photoUrl: "", resumeUrl: "",
    experience: [], education: [], tags: [], notes: ""
};

export default function AddCandidateDialog({
    open,
    onOpenChange,
    jobId,
    jobTitle
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobId: number;
    jobTitle: string;
}) {
    const [mode, setMode] = useState<"upload" | "manual">("upload");
    const [formData, setFormData] = useState<CandidateForm>({ ...INITIAL_FORM, jobId: jobId.toString() });
    const [isUploading, setIsUploading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [activeTab, setActiveTab] = useState("brief");

    // Eligibility State
    const [resumeText, setResumeText] = useState("");
    const [eligibility, setEligibility] = useState<{ eligible: boolean; score: number; reasons: string[]; missing_skills?: string[] } | null>(null);
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

    // Temp State for new items
    const [newExp, setNewExp] = useState<Experience>({ title: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" });
    const [newEdu, setNewEdu] = useState<Education>({ school: "", degree: "", field: "", startDate: "", endDate: "", current: false, description: "" });
    const [isAddingExp, setIsAddingExp] = useState(false);
    const [isAddingEdu, setIsAddingEdu] = useState(false);

    // Job Selection State (for Global Add)
    const [jobs, setJobs] = useState<{ id: number; job_title: string }[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>(jobId ? jobId.toString() : "");

    // Reset when opening
    useEffect(() => {
        if (open) {
            setMode("upload");
            // If explicit jobId provided, use it. Otherwise reset.
            if (jobId) {
                setFormData({ ...INITIAL_FORM, jobId: jobId.toString() });
                setSelectedJobId(jobId.toString());
            } else {
                setFormData({ ...INITIAL_FORM, jobId: "" });
                setSelectedJobId("");
                fetchJobs(); // Fetch jobs if not provided
            }
            setActiveTab("brief");
        }
    }, [open, jobId]);

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/jobs"); // Assuming this returns all jobs or logic needs filter
            if (res.ok) {
                const data = await res.json();
                // Filter for active jobs only if needed, but for now take all
                setJobs(data);
            }
        } catch (error) {
            console.error("Failed to fetch jobs");
        }
    };

    // Strict Eligibility Check
    useEffect(() => {
        if (resumeText && selectedJobId) {
            checkEligibility(resumeText, selectedJobId);
        }
    }, [resumeText, selectedJobId]);

    const checkEligibility = async (text: string, jId: string) => {
        setIsCheckingEligibility(true);
        try {
            const res = await fetch(`/api/jobs/${jId}/check-eligibility`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeText: text }),
            });
            const data = await res.json();
            if (data.success) {
                setEligibility(data.analysis);
                if (!data.analysis.eligible) {
                    toast.error("Candidate is NOT eligible for this role");
                } else {
                    toast.success("Candidate matches job requirements");
                }
            }
        } catch (err) {
            console.error("Eligibility Check failed", err);
        } finally {
            setIsCheckingEligibility(false);
        }
    };

    // Handlers
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setIsParsing(true);
        const uploadData = new FormData();
        uploadData.append("file", file);

        try {
            // 1. Upload
            const uploadRes = await fetch("/api/uploads?folder=resumes", { method: "POST", body: uploadData });
            if (!uploadRes.ok) throw new Error("Upload failed");
            const { url } = await uploadRes.json();

            setFormData(prev => ({ ...prev, resumeUrl: url }));
            toast.success("Resume uploaded");

            // 2. Parse (AI)
            const parseRes = await fetch("/api/parse-resume", { method: "POST", body: uploadData });
            const parseJson = await parseRes.json();

            if (parseJson.success && parseJson.data) {
                setResumeText(parseJson.text || ""); // Store full text for validation
                const { personalInfo, experience, education, socialLinks } = parseJson.data;

                setFormData(prev => ({
                    ...prev,
                    firstName: personalInfo?.name?.split(" ")[0] || prev.firstName,
                    lastName: personalInfo?.name?.split(" ").slice(1).join(" ") || prev.lastName,
                    email: personalInfo?.email || prev.email,
                    phone: personalInfo?.phone || prev.phone,
                    location: personalInfo?.city || prev.location,
                    website: socialLinks?.linkedin || prev.website,
                    experience: Array.isArray(experience) ? experience.map((e: any) => ({
                        title: e.title || "",
                        company: e.company || "",
                        location: e.location || "",
                        startDate: e.startDate || "",
                        endDate: e.endDate || "",
                        current: e.isCurrent || false,
                        description: e.description || ""
                    })) : [],
                    education: Array.isArray(education) ? education.map((e: any) => ({
                        school: e.institution || "",
                        degree: e.degree || "",
                        field: e.major || "",
                        startDate: e.startDate || "",
                        endDate: e.endDate || "",
                        current: e.isCurrent || false,
                        description: e.description || ""
                    })) : []
                }));
                toast.success("Resume parsed successfully!");
                setMode("manual"); // Switch to manual view to review details
            }
        } catch (error) {
            console.error(error);
            toast.error("Error processing resume");
        } finally {
            setIsUploading(false);
            setIsParsing(false);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!formData.firstName || !formData.lastName || !formData.email) {
            toast.error("Please fill in required fields (Name, Email)");
            return;
        }

        if (!formData.jobId) {
            toast.error("Please select a job to apply to");
            return;
        }

        try {
            const res = await fetch("/api/admin/candidates/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success("Candidate added successfully");
                onOpenChange(false);
                // Ideally refresh parent list here
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to add candidate");
            }
        } catch (error: any) {
            toast.error(error.message || "Error saving candidate");
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append("file", file);

        try {
            const res = await fetch("/api/uploads?folder=candidates", { method: "POST", body: uploadData });
            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, photoUrl: data.url }));
                toast.success("Profile picture uploaded");
            } else {
                toast.error("Failed to upload image");
            }
        } catch (error) {
            console.error("Upload error", error);
            toast.error("Error uploading image");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between sticky top-0 bg-white z-10">
                    <DialogTitle>Add Candidate</DialogTitle>
                    {/* Close button handled by Dialog primitive usually, but custom header implies custom close if needed */}
                </DialogHeader>

                <div className="p-6">
                    {mode === "upload" ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full max-w-2xl border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 p-12 text-center transition-all hover:bg-blue-50 hover:border-blue-300 cursor-pointer group"
                            >
                                <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-105 transition-transform">
                                    <FileText className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose a file or drop it here</h3>
                                <p className="text-sm text-gray-500 mb-8">Supported files: DOC, DOCX, PDF, RTF, TXT (10MB size limit)</p>

                                <div className="flex justify-center gap-4">
                                    <div>
                                        <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                                            Upload File
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.txt"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                    </div>
                                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); setMode("manual"); }}>
                                        Add Manually
                                    </Button>
                                </div>
                                {isUploading && <div className="mt-4 text-sm text-blue-600 animate-pulse flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {isParsing ? "Analyzing..." : "Uploading..."}</div>}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* ELIGIBILITY ALERT */}
                            {isCheckingEligibility && (
                                <div className="p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center gap-2 border border-blue-100 mb-4">
                                    <Loader2 className="animate-spin h-5 w-5" />
                                    AI is checking candidate eligibility against Job Description...
                                </div>
                            )}

                            {eligibility && !isCheckingEligibility && (
                                <div className={`p-4 rounded-xl border mb-4 flex items-start gap-4 ${eligibility.eligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className={`p-2 rounded-full ${eligibility.eligible ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {eligibility.eligible ? (
                                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                                        ) : (
                                            <X className="h-6 w-6 text-red-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-bold mb-1 ${eligibility.eligible ? 'text-green-800' : 'text-red-800'}`}>
                                            {eligibility.eligible ? "Eligible Candidate" : "Candidate Not Eligible"}
                                        </h3>
                                        <p className={`text-sm mb-2 ${eligibility.eligible ? 'text-green-700' : 'text-red-700'}`}>
                                            {eligibility.eligible
                                                ? "Candidate matches the core requirements."
                                                : "Candidate does not meet strict job requirements. Application blocked."}
                                        </p>
                                        <div className="space-y-1">
                                            {eligibility.reasons?.map((reason, i) => (
                                                <div key={i} className={`text-sm flex items-start gap-2 ${eligibility.eligible ? 'text-green-700' : 'text-red-700'}`}>
                                                    <span>•</span> {reason}
                                                </div>
                                            ))}
                                            {eligibility.missing_skills?.map((skill, i) => (
                                                <div key={`miss-${i}`} className="text-sm flex items-start gap-2 text-red-700 font-bold">
                                                    <span>•</span> Missing: {skill}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-center bg-white/50 p-2 rounded-lg border border-gray-200">
                                        <span className={`block text-2xl font-bold ${eligibility.eligible ? 'text-green-700' : 'text-red-700'}`}>{eligibility.score}%</span>
                                        <span className="text-xs text-gray-600 font-medium">Match</span>
                                    </div>
                                </div>
                            )}

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-auto gap-6">
                                    {["brief", "experience", "education", "additional_info"].map(tab => (
                                        <TabsTrigger
                                            key={tab}
                                            value={tab}
                                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-green-700 px-0 py-3 uppercase text-xs font-bold tracking-wide"
                                        >
                                            {tab.replace("_", " ")}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {/* BRIEF TAB */}
                                <TabsContent value="brief" className="pt-6 space-y-6">
                                    <div className="flex gap-8">
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>First name*</Label>
                                                    <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} placeholder="First name" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Last name*</Label>
                                                    <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} placeholder="Last name" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Location</Label>
                                                    <div className="relative">
                                                        <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Location" />
                                                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Email*</Label>
                                                    <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Phone number</Label>
                                                <div className="flex gap-2">
                                                    <Select defaultValue="+92"><SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="+92">PK +92</SelectItem></SelectContent></Select>
                                                    <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="301 2345678" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Website or social network</Label>
                                                {formData.website ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                                                        <Button size="icon" variant="ghost" onClick={() => setFormData({ ...formData, website: "" })}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="link" className="text-blue-600 p-0 h-auto" onClick={() => setFormData({ ...formData, website: "https://" })}>ADD WEBSITE</Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4">
                                                <div className="space-y-2">
                                                    <Label>Source type*</Label>
                                                    <Select onValueChange={v => setFormData({ ...formData, sourceType: v })}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="manual">Manual Entry</SelectItem>
                                                            <SelectItem value="referral">Referral</SelectItem>
                                                            <SelectItem value="agency">Agency</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Job to apply*</Label>
                                                    {jobId ? (
                                                        <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-gray-50 text-sm">
                                                            <span>{jobTitle}</span>
                                                            <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-transparent"><X className="h-3 w-3" /></Button>
                                                        </div>
                                                    ) : (
                                                        <Select value={selectedJobId} onValueChange={(v) => { setSelectedJobId(v); setFormData({ ...formData, jobId: v }); }}>
                                                            <SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger>
                                                            <SelectContent>
                                                                {jobs.map(j => (
                                                                    <SelectItem key={j.id} value={j.id.toString()}>{j.job_title}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Source*</Label>
                                                <div className="relative">
                                                    <Input value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} />
                                                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Avatar Section */}
                                        <div className="w-48 flex flex-col items-center space-y-3">
                                            <Avatar className="h-32 w-32 border-4 border-gray-100">
                                                <AvatarImage src={formData.photoUrl} />
                                                <AvatarFallback className="bg-gray-700 text-white text-4xl">
                                                    {formData.firstName?.[0]}{formData.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>

                                            <input
                                                type="file"
                                                ref={imageInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />

                                            <Button variant="outline" size="sm" className="w-full border-green-600 text-green-700" onClick={() => imageInputRef.current?.click()} disabled={isUploading}>
                                                {isUploading ? "Uploading..." : "Upload image"}
                                            </Button>

                                            {formData.photoUrl && (
                                                <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setFormData({ ...formData, photoUrl: "" })}>
                                                    Remove image
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* EXPERIENCE TAB */}
                                <TabsContent value="experience" className="pt-6">
                                    {formData.experience.length === 0 && !isAddingExp ? (
                                        <div className="text-gray-500">
                                            No experience details for this candidate yet.
                                            <Button variant="link" className="text-blue-600 pl-0 block mt-2" onClick={() => setIsAddingExp(true)}>ADD EXPERIENCE</Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {formData.experience.map((exp, idx) => (
                                                <div key={idx} className="border p-4 rounded-lg relative bg-white">
                                                    <h4 className="font-bold">{exp.title}</h4>
                                                    <p className="text-sm text-gray-600">{exp.company} | {exp.startDate} - {exp.current ? "Present" : exp.endDate}</p>
                                                    <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => {
                                                        const newExps = [...formData.experience];
                                                        newExps.splice(idx, 1);
                                                        setFormData({ ...formData, experience: newExps });
                                                    }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </div>
                                            ))}
                                            {!isAddingExp && <Button variant="outline" onClick={() => setIsAddingExp(true)}><Plus className="h-4 w-4 mr-2" /> Add Another</Button>}
                                        </div>
                                    )}

                                    {isAddingExp && (
                                        <div className="bg-gray-50 p-6 rounded-lg border mt-4 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Title</Label><Input value={newExp.title} onChange={e => setNewExp({ ...newExp, title: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>Company</Label><Input value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={newExp.startDate} onChange={e => setNewExp({ ...newExp, startDate: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={newExp.endDate} onChange={e => setNewExp({ ...newExp, endDate: e.target.value })} /></div>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="ghost" onClick={() => setIsAddingExp(false)}>Cancel</Button>
                                                <Button onClick={() => {
                                                    setFormData({ ...formData, experience: [...formData.experience, newExp] });
                                                    setNewExp(INITIAL_FORM.experience[0] || { title: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" });
                                                    setIsAddingExp(false);
                                                }}>Save</Button>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* EDUCATION TAB */}
                                <TabsContent value="education" className="pt-6">
                                    {formData.education.length === 0 && !isAddingEdu ? (
                                        <div className="text-gray-500">
                                            No education details for this candidate yet.
                                            <Button variant="link" className="text-blue-600 pl-0 block mt-2" onClick={() => setIsAddingEdu(true)}>ADD EDUCATION</Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {formData.education.map((edu, idx) => (
                                                <div key={idx} className="border p-4 rounded-lg relative bg-white">
                                                    <h4 className="font-bold">{edu.school}</h4>
                                                    <p className="text-sm text-gray-600">{edu.degree}, {edu.field} | {edu.startDate} - {edu.endDate}</p>
                                                    <Button size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => {
                                                        const newEdus = [...formData.education];
                                                        newEdus.splice(idx, 1);
                                                        setFormData({ ...formData, education: newEdus });
                                                    }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </div>
                                            ))}
                                            {!isAddingEdu && <Button variant="outline" onClick={() => setIsAddingEdu(true)}><Plus className="h-4 w-4 mr-2" /> Add Another</Button>}
                                        </div>
                                    )}

                                    {isAddingEdu && (
                                        <div className="bg-gray-50 p-6 rounded-lg border mt-4 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>School</Label><Input value={newEdu.school} onChange={e => setNewEdu({ ...newEdu, school: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>Degree</Label><Input value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>Field of Study</Label><Input value={newEdu.field} onChange={e => setNewEdu({ ...newEdu, field: e.target.value })} /></div>
                                                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={newEdu.endDate} onChange={e => setNewEdu({ ...newEdu, endDate: e.target.value })} /></div>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="ghost" onClick={() => setIsAddingEdu(false)}>Cancel</Button>
                                                <Button onClick={() => {
                                                    setFormData({ ...formData, education: [...formData.education, newEdu] });
                                                    setNewEdu(INITIAL_FORM.education[0] || { school: "", degree: "", field: "", startDate: "", endDate: "", current: false, description: "" });
                                                    setIsAddingEdu(false);
                                                }}>Save</Button>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* ADDITIONAL INFO TAB */}
                                <TabsContent value="additional_info" className="pt-6 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-lg font-semibold">Attachments</Label>
                                            <Button variant="ghost" className="text-sm font-semibold">Add attachment</Button>
                                        </div>
                                        <div className="text-gray-500 border-t py-4">There are no attachment yet</div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-lg font-semibold">Tags</Label>
                                        <div className="relative">
                                            <Input placeholder="Add tag" />
                                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-lg font-semibold">Notes</Label>
                                        <div className="flex gap-2">
                                            <Avatar className="h-10 w-10"><AvatarFallback>ME</AvatarFallback></Avatar>
                                            <Input placeholder="Share something with your team..." className="flex-1" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                        </div>
                                    </div>
                                </TabsContent>

                            </Tabs>
                        </div>
                    )}
                </div>

                {mode === "manual" && (
                    <DialogFooter className="border-t p-4 bg-gray-50">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button
                            className={`${eligibility && !eligibility.eligible ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'} text-white`}
                            onClick={handleSave}
                            disabled={eligibility ? !eligibility.eligible : false}
                        >
                            {eligibility && !eligibility.eligible ? "Ineligible - Blocked" : "Add candidate"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
