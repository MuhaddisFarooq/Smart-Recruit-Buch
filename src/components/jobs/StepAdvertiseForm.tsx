"use client";

import { ArrowRight, Globe, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type StepAdvertiseFormProps = {
    formData: any;
    setFormData: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
    jobId: number | null;
};

export default function StepAdvertiseForm({ formData, setFormData, onNext, onBack, jobId }: StepAdvertiseFormProps) {
    const [advertising, setAdvertising] = useState(false);
    const [advertised, setAdvertised] = useState(false);

    const handleAdvertise = async () => {
        if (!jobId) {
            toast.error("Job ID not found. Please try publishing again.");
            return;
        }

        setAdvertising(true);
        const toastId = toast.loading("Advertising job...");

        try {
            const res = await fetch(`/api/jobs/${jobId}/advertise`, { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                toast.success("Job advertised successfully", { id: toastId });
                setAdvertised(true);
            } else {
                toast.error(data.error || "Failed to advertise job", { id: toastId });
            }
        } catch (error) {
            toast.error("An error occurred", { id: toastId });
        } finally {
            setAdvertising(false);
        }
    };

    return (
        <div>
            <h2 className="text-lg font-semibold text-[#238740] mb-6">Advertise your job</h2>

            <p className="text-sm text-[#666] mb-8">
                Your job is published! Now you can advertise it to our careers website to reach more candidates.
            </p>

            {/* Advertise Action */}
            <div className={`border rounded-lg p-6 mb-8 transition-colors ${advertised ? "border-[#238740] bg-[#238740]/5" : "border-[#E6E6E6]"}`}>
                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className={`p-3 rounded-full ${advertised ? "bg-[#238740] text-white" : "bg-neutral-100 text-neutral-500"}`}>
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-800 mb-1">
                                {advertised ? "Job Advertised" : "Advertise to Careers Website"}
                            </h3>
                            <p className="text-sm text-neutral-500 max-w-md">
                                {advertised
                                    ? "This job is live on the careers portal. Candidates can now find and apply for this position."
                                    : "Publish this job listing to the public careers portal to start receiving applications immediately."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pl-[68px]">
                    {advertised ? (
                        <div className="flex items-center gap-2 text-[#238740] font-medium text-sm">
                            <CheckCircle className="w-5 h-5" />
                            Successfully Advertised
                        </div>
                    ) : (
                        <button
                            onClick={handleAdvertise}
                            disabled={advertising}
                            className="px-6 py-2.5 bg-[#238740] text-white text-sm font-semibold rounded hover:bg-[#1d7235] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {advertising ? "Advertising..." : "Advertise Now"}
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#E6E6E6]">
                <button
                    type="button"
                    onClick={onNext}
                    className="flex items-center gap-2 px-6 py-2.5 border border-[#238740] text-[#238740] text-sm font-medium rounded hover:bg-[#238740]/5 transition-colors"
                >
                    {advertised ? "Finish" : "Skip & Finish"}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
