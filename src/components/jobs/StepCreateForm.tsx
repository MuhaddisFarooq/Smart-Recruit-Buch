"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Info, ArrowRight, Eye } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

type StepCreateFormProps = {
    formData: any;
    setFormData: (data: any) => void;
    onNext: () => void;
};

const WORK_LOCATION_OPTIONS = [
    { value: "on-site", label: "Employees work on-site", info: true },
    { value: "remote", label: "Employees work remotely", info: true },
    { value: "hybrid", label: "Employees work in a hybrid mode", info: true },
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

export default function StepCreateForm({ formData, setFormData, onNext }: StepCreateFormProps) {
    const updateField = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    return (
        <div>
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
                <label className="block text-sm text-[#333] mb-1">
                    Job Title<span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.job_title || ""}
                    onChange={(e) => updateField("job_title", e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                    placeholder="Start typing your job title to view templates"
                />
            </div>

            {/* Location */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-[#333]">
                        Location<span className="text-red-500">*</span>
                    </label>
                    <button type="button" className="text-xs text-[#666] hover:text-[#333]">
                        Fill Manually
                    </button>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={formData.location || ""}
                        onChange={(e) => updateField("location", e.target.value)}
                        className="w-full h-10 px-3 pr-10 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                        placeholder="Enter job location"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                </div>
            </div>

            {/* Work Location Type */}
            <div className="mb-4">
                <label className="block text-sm text-[#333] mb-2">
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
                            {option.info && <Info className="w-3 h-3 text-[#999]" />}
                        </label>
                    ))}
                </div>
            </div>

            {/* Job Ad Language */}
            <div className="mb-6">
                <label className="block text-sm text-[#333] mb-1">
                    Job Ad Language<span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.job_language || "English - English (US)"}
                    onChange={(e) => updateField("job_language", e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] bg-white"
                >
                    {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
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
                value={formData.additional_info || ""}
                onChange={(value) => updateField("additional_info", value)}
                placeholder="Add any additional information..."
            />

            {/* Add Videos */}
            <div className="mb-6">
                <label className="block text-sm text-[#333] mb-1">Add Videos</label>
                <input
                    type="text"
                    value={formData.video_url || ""}
                    onChange={(e) => updateField("video_url", e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                    placeholder="Youtube, Vimeo or Digi-Me video"
                />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-[#E6E6E6]">
                <button
                    type="button"
                    onClick={onNext}
                    className="flex items-center gap-2 px-5 py-2 bg-[#238740] text-white text-sm font-medium rounded hover:bg-[#1d7235] transition-colors"
                >
                    Next
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-[#666] hover:text-[#333]"
                >
                    <Eye className="w-4 h-4" />
                    Preview
                </button>
            </div>
        </div>
    );
}
