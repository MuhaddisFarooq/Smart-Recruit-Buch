"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search, Info, Eye, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/jobs/RichTextEditor";

const WORK_LOCATION_OPTIONS = [
    { value: "on-site", label: "Employees work on-site" },
    { value: "remote", label: "Employees work remotely" },
    { value: "hybrid", label: "Employees work in a hybrid mode" },
];

const LANGUAGES = [
    "English - English (US)",
    "English - English (UK)",
    "Urdu",
    "Arabic",
    "French",
    "German",
    "Spanish",
];

const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR"];
const SALARY_PERIODS = ["Monthly", "Yearly", "Hourly", "Weekly"];

type JobData = {
    id: number;
    job_title: string;
    department?: string;
    department_id?: string;
    hod_id?: string;
    location: string;
    work_location_type: string;
    job_language: string;
    company_description: string;
    description: string;
    qualifications: string;
    additional_information: string;
    video_url: string;
    auto_unpublish_date: string;
    salary_from: string;
    salary_to: string;
    currency: string;
    salary_period: string;
    status: string;
};

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);

    const [formData, setFormData] = useState<JobData>({
        id: 0,
        job_title: "",
        department: "",
        department_id: "",
        hod_id: "",
        location: "",
        work_location_type: "on-site",
        job_language: "English - English (US)",
        company_description: "",
        description: "",
        qualifications: "",
        additional_information: "",
        video_url: "",
        auto_unpublish_date: "",
        salary_from: "",
        salary_to: "",
        currency: "",
        salary_period: "",
        status: "draft",
    });

    useEffect(() => {
        fetchJob();
        fetchDepartments();
    }, [jobId]);

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/departments");
            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    setDepartments(data.data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const fetchJob = async () => {
        try {
            const res = await fetch(`/api/jobs/${jobId}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({ ...formData, ...data });
            } else {
                toast.error("Job not found");
                router.push("/jobs");
            }
        } catch (error) {
            toast.error("Failed to load job");
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSave = async (publish = false) => {
        if (!formData.job_title) {
            toast.error("Job title is required");
            return;
        }

        setSaving(true);
        try {
            // If publishing, check if auto_unpublish_date is in the past and clear it
            let autoUnpublishDate = formData.auto_unpublish_date;
            if (publish && autoUnpublishDate) {
                const unpublishDate = new Date(autoUnpublishDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // If the date is in the past or today, clear it to allow republishing
                if (unpublishDate <= today) {
                    autoUnpublishDate = "";
                }
            }

            const res = await fetch(`/api/jobs/${jobId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    auto_unpublish_date: autoUnpublishDate || null,
                    status: publish ? "active" : formData.status,
                }),
            });

            if (res.ok) {
                toast.success(publish ? "Job published!" : "Job saved");
                router.push("/jobs");
            } else {
                toast.error("Failed to save job");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#238740]"></div>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-[960px] mx-auto">
                {/* Page Title */}
                <div className="flex items-center gap-2 mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#333]">Edit job ad</h1>
                    <span className="text-sm text-[#999]">(Default)</span>
                </div>

                {/* Wizard Card */}
                <div className="bg-white border border-[#E6E6E6] rounded shadow-sm p-6 md:p-8">
                    {/* Simple Stepper */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#238740] text-white text-xs flex items-center justify-center">1</div>
                            <span className="text-sm font-medium text-[#333]">Edit</span>
                        </div>
                        <div className="flex-1 h-[2px] bg-[#E6E6E6]" />
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border-2 border-[#238740] text-[#238740] text-xs flex items-center justify-center">2</div>
                            <span className="text-sm text-[#666]">Advertise</span>
                        </div>
                    </div>

                    {/* Company Banner */}
                    <div className="mb-6 rounded overflow-hidden border border-[#E6E6E6]">
                        <Image
                            src="/huge.jpg"
                            alt="Company Banner"
                            width={800}
                            height={120}
                            className="w-full h-28 object-cover"
                        />
                    </div>

                    {/* Job Title */}
                    <div className="mb-4">
                        <label className="block text-sm text-[#238740] mb-1">
                            Job Title<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.job_title || ""}
                            onChange={(e) => updateField("job_title", e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                        />
                    </div>

                    {/* Department */}
                    <div className="mb-4">
                        <label className="block text-sm text-[#238740] mb-1">
                            Department<span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.department_id || ""}
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                const selectedDept = departments.find((d) => d.id === selectedId);
                                if (selectedDept) {
                                    setFormData({
                                        ...formData,
                                        department: selectedDept.dept,
                                        department_id: selectedDept.id,
                                        hod_id: selectedDept.hod
                                    });
                                } else {
                                    setFormData({
                                        ...formData,
                                        department: "",
                                        department_id: "",
                                        hod_id: ""
                                    });
                                }
                            }}
                            className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] bg-white"
                        >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.dept}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Location Section */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm text-[#238740]">Location<span className="text-red-500">*</span></label>
                        </div>
                        <input
                            type="text"
                            value={formData.location || ""}
                            onChange={(e) => updateField("location", e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                            placeholder="e.g. Multan, Pakistan"
                        />
                    </div>

                    {/* Work Location Type */}
                    <div className="mb-4">
                        <label className="block text-sm text-[#238740] mb-2">
                            Work location type<span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {WORK_LOCATION_OPTIONS.map((option) => (
                                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="work_location_type"
                                        value={option.value}
                                        checked={formData.work_location_type === option.value}
                                        onChange={(e) => updateField("work_location_type", e.target.value)}
                                        className="w-4 h-4 accent-[#238740]"
                                    />
                                    <span className="text-sm text-[#333]">{option.label}</span>
                                    <Info className="w-3 h-3 text-[#999]" />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Job Ad Language */}
                    <div className="mb-6">
                        <label className="block text-sm text-[#238740] mb-1">
                            Job Ad Language<span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={formData.job_language || "English - English (US)"}
                                onChange={(e) => updateField("job_language", e.target.value)}
                                className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] bg-white appearance-none"
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                            {formData.job_language && (
                                <button
                                    onClick={() => updateField("job_language", "")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Rich Text Editors */}
                    <RichTextEditor
                        label="Company Description"
                        value={formData.company_description || ""}
                        onChange={(value) => updateField("company_description", value)}
                        placeholder="Describe your company..."
                    />

                    <RichTextEditor
                        label="Job Description"
                        value={formData.description || ""}
                        onChange={(value) => updateField("description", value)}
                        placeholder="Describe the responsibilities and day to day of the job"
                    />

                    <RichTextEditor
                        label="Qualifications"
                        value={formData.qualifications || ""}
                        onChange={(value) => updateField("qualifications", value)}
                        placeholder="Describe the requirements and skills needed for the job"
                    />

                    <RichTextEditor
                        label="Additional Information"
                        value={formData.additional_information || ""}
                        onChange={(value) => updateField("additional_information", value)}
                        placeholder="Add any additional information..."
                    />

                    {/* Add Videos */}
                    <div className="mb-4">
                        <label className="block text-sm text-[#333] mb-1">Add Videos</label>
                        <input
                            type="text"
                            value={formData.video_url || ""}
                            onChange={(e) => updateField("video_url", e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                            placeholder="Youtube, Vimeo or Digi-Me video"
                        />
                    </div>

                    {/* Auto Unpublish */}
                    <div className="mb-6">
                        <label className="block text-sm text-[#238740] mb-1">Automatically Unpublish Job</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={formData.auto_unpublish_date || ""}
                                onChange={(e) => updateField("auto_unpublish_date", e.target.value)}
                                className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                            />
                        </div>
                    </div>

                    {/* Compensation */}
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-[#238740] mb-2">Compensation</h3>
                        <div className="flex items-center gap-2 text-xs text-[#666] mb-4">
                            <Info className="w-3 h-3" />
                            <span>To keep the compensation private, leave the compensation fields empty.</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-[#238740] mb-1">From</label>
                                <input
                                    type="text"
                                    value={formData.salary_from || ""}
                                    onChange={(e) => updateField("salary_from", e.target.value)}
                                    className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                    placeholder="Type value"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#238740] mb-1">To</label>
                                <input
                                    type="text"
                                    value={formData.salary_to || ""}
                                    onChange={(e) => updateField("salary_to", e.target.value)}
                                    className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                                    placeholder="Type value"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-[#238740] mb-1">Currency</label>
                                <select
                                    value={formData.currency || ""}
                                    onChange={(e) => updateField("currency", e.target.value)}
                                    className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] bg-white"
                                >
                                    <option value="">Please select</option>
                                    {CURRENCIES.map((curr) => (
                                        <option key={curr} value={curr}>{curr}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-[#238740] mb-1">Salary Period</label>
                                <select
                                    value={formData.salary_period || ""}
                                    onChange={(e) => updateField("salary_period", e.target.value)}
                                    className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] bg-white"
                                >
                                    <option value="">Please select</option>
                                    {SALARY_PERIODS.map((period) => (
                                        <option key={period} value={period}>{period}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-[#E6E6E6]">
                        <button
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="px-5 py-2 bg-[#238740] text-white text-sm font-medium rounded hover:bg-[#1d7235] transition-colors disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Publish"}
                        </button>
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="px-5 py-2 border border-[#238740] text-[#238740] text-sm font-medium rounded hover:bg-[#238740]/5 transition-colors disabled:opacity-50"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex items-center gap-2 text-sm text-[#666] hover:text-[#333]"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E6E6]">
                            <h3 className="text-lg font-medium text-[#333]">{formData.job_title || "Job Title"}</h3>
                            <button onClick={() => setShowPreview(false)} className="text-[#999] hover:text-[#666]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex">
                            {/* Left Content */}
                            <div className="flex-1 p-6">
                                {/* Banner */}
                                <Image
                                    src="/huge.jpg"
                                    alt="Company Banner"
                                    width={600}
                                    height={100}
                                    className="w-full h-24 object-cover rounded mb-4"
                                />

                                {/* Location */}
                                <p className="text-sm text-[#666] mb-4">
                                    {formData.location || "Location not specified"}
                                </p>

                                {/* Company Description */}
                                {formData.company_description && (
                                    <div className="mb-4">
                                        <h4 className="text-base font-medium text-[#333] mb-2">Company Description</h4>
                                        <p className="text-sm text-[#666] whitespace-pre-wrap">{formData.company_description}</p>
                                    </div>
                                )}

                                {/* Job Description */}
                                {formData.description && (
                                    <div className="mb-4">
                                        <h4 className="text-base font-medium text-[#333] mb-2">Job Description</h4>
                                        <p className="text-sm text-[#666] whitespace-pre-wrap">{formData.description}</p>
                                    </div>
                                )}

                                {/* Qualifications */}
                                {formData.qualifications && (
                                    <div className="mb-4">
                                        <h4 className="text-base font-medium text-[#333] mb-2">Qualifications</h4>
                                        <p className="text-sm text-[#666] whitespace-pre-wrap">{formData.qualifications}</p>
                                    </div>
                                )}

                                {/* Additional Information */}
                                {formData.additional_information && (
                                    <div className="mb-4">
                                        <h4 className="text-base font-medium text-[#333] mb-2">Additional Information</h4>
                                        <p className="text-sm text-[#666] whitespace-pre-wrap">{formData.additional_information}</p>
                                    </div>
                                )}

                                {/* Apply Button */}
                                <div className="mt-6">
                                    <button className="w-full py-3 bg-[#238740] text-white font-medium rounded hover:bg-[#1d7235]">
                                        I'm interested
                                    </button>
                                </div>
                            </div>

                            {/* Right Sidebar */}
                            <div className="w-64 bg-[#FAFAFA] p-4 border-l border-[#E6E6E6]">
                                <button className="w-full py-2 bg-[#238740] text-white text-sm font-medium rounded mb-2">
                                    I'm interested
                                </button>
                                <button className="w-full py-2 border border-[#D1D1D1] text-[#666] text-sm rounded mb-6">
                                    Refer a friend
                                </button>

                                <div className="mb-4">
                                    <p className="text-xs text-[#999] mb-2">Posted by</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#238740] flex items-center justify-center text-white text-xs">KR</div>
                                        <span className="text-sm text-[#333]">Kamran Rao</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-xs text-[#999] mb-2">Share this job</p>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 border border-[#D1D1D1] rounded flex items-center justify-center text-[#666] cursor-pointer hover:border-[#999]">f</div>
                                        <div className="w-8 h-8 border border-[#D1D1D1] rounded flex items-center justify-center text-[#666] cursor-pointer hover:border-[#999]">in</div>
                                        <div className="w-8 h-8 border border-[#D1D1D1] rounded flex items-center justify-center text-[#666] cursor-pointer hover:border-[#999]">X</div>
                                        <div className="w-8 h-8 border border-[#D1D1D1] rounded flex items-center justify-center text-[#666] cursor-pointer hover:border-[#999]">✉</div>
                                    </div>
                                </div>

                                <div className="text-xs text-[#999] mt-6">
                                    Powered by <span className="text-[#333]">Smart</span><span className="text-[#238740]">Recruiters</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
