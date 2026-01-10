"use client";

import { useState } from "react";
import { Share2, Copy, Check, Linkedin, Facebook, Twitter, Mail, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

type StepShareFormProps = {
    formData: any;
    setFormData: (data: any) => void;
    onPublish: () => void;
    onSave: () => void;
};

export default function StepShareForm({ formData, setFormData, onPublish, onSave }: StepShareFormProps) {
    const [copied, setCopied] = useState(false);

    const jobUrl = `https://jobs.company.com/positions/${formData.job_title?.toLowerCase().replace(/\s+/g, "-") || "new-position"}`;

    const copyLink = () => {
        navigator.clipboard.writeText(jobUrl);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOptions = [
        { name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
        { name: "Facebook", icon: Facebook, color: "#1877F2" },
        { name: "Twitter", icon: Twitter, color: "#1DA1F2" },
        { name: "Email", icon: Mail, color: "#666666" },
    ];

    return (
        <div>
            <h2 className="text-lg font-semibold text-[#238740] mb-2">Share your job</h2>
            <p className="text-sm text-[#666] mb-6">
                Share your job listing on social media or copy the direct link.
            </p>

            {/* Job Preview Card */}
            <div className="border border-[#E6E6E6] rounded p-4 mb-6 bg-[#FAFAFA]">
                <h3 className="text-base font-medium text-[#333] mb-1">
                    {formData.job_title || "Job Title"}
                </h3>
                <p className="text-sm text-[#666] mb-2">
                    {formData.location || "Location"} • {formData.type_of_employment || "Full-time"}
                </p>
                <p className="text-xs text-[#999]">
                    {formData.industry || "Industry"} • {formData.experience_level || "Experience Level"}
                </p>
            </div>

            {/* Copy Link */}
            <div className="mb-6">
                <label className="block text-sm text-[#333] mb-2">Job URL</label>
                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 h-10 px-3 bg-[#F5F5F5] border border-[#D1D1D1] rounded">
                        <LinkIcon className="w-4 h-4 text-[#999]" />
                        <span className="text-sm text-[#666] truncate">{jobUrl}</span>
                    </div>
                    <button
                        type="button"
                        onClick={copyLink}
                        className="flex items-center gap-2 px-4 py-2 border border-[#D1D1D1] rounded hover:bg-[#F5F5F5] transition-colors"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-[#238740]" />
                        ) : (
                            <Copy className="w-4 h-4 text-[#666]" />
                        )}
                        <span className="text-sm text-[#333]">{copied ? "Copied" : "Copy"}</span>
                    </button>
                </div>
            </div>

            {/* Share Buttons */}
            <div className="mb-8">
                <label className="block text-sm text-[#333] mb-3">Share on social media</label>
                <div className="flex gap-3">
                    {shareOptions.map((option) => (
                        <button
                            key={option.name}
                            type="button"
                            className="flex items-center justify-center w-10 h-10 rounded-full border border-[#E6E6E6] hover:border-[#D1D1D1] transition-colors"
                            style={{ color: option.color }}
                        >
                            <option.icon className="w-5 h-5" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#E6E6E6]">
                <button
                    type="button"
                    onClick={onPublish}
                    className="px-5 py-2 bg-[#238740] text-white text-sm font-medium rounded hover:bg-[#1d7235] transition-colors"
                >
                    Publish Job
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    className="px-5 py-2 border border-[#238740] text-[#238740] text-sm font-medium rounded hover:bg-[#238740]/5 transition-colors"
                >
                    Save as Draft
                </button>
            </div>
        </div>
    );
}
