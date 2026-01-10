"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import WizardStepper from "@/components/jobs/WizardStepper";
import WarningBanner from "@/components/jobs/WarningBanner";
import StepCreateForm from "@/components/jobs/StepCreateForm";
import StepDetailsForm from "@/components/jobs/StepDetailsForm";
import StepHiringTeamForm from "@/components/jobs/StepHiringTeamForm";
import StepAdvertiseForm from "@/components/jobs/StepAdvertiseForm";
import StepShareForm from "@/components/jobs/StepShareForm";

type JobFormData = {
    // Step 1: Create
    job_title: string;
    location: string;
    work_location_type: string;
    job_language: string;
    company_description: string;
    description: string;
    qualifications: string;
    additional_info: string;
    video_url: string;

    // Step 2: Details
    industry: string;
    function: string;
    experience_level: string;
    type_of_employment: string;
    salary_from: string;
    salary_to: string;
    currency: string;
    salary_period: string;

    // Step 3: Hiring Team
    hiring_team: any[];

    // Other
    status: string;
};

const INITIAL_FORM_DATA: JobFormData = {
    job_title: "",
    location: "",
    work_location_type: "on-site",
    job_language: "English - English (US)",
    company_description: "",
    description: "",
    qualifications: "",
    additional_info: "",
    video_url: "",
    industry: "",
    function: "",
    experience_level: "",
    type_of_employment: "",
    salary_from: "",
    salary_to: "",
    currency: "",
    salary_period: "",
    hiring_team: [],
    status: "draft",
};

export default function CreateJobPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [formData, setFormData] = useState<JobFormData>(INITIAL_FORM_DATA);
    const [saving, setSaving] = useState(false);

    const goToStep = (step: number) => {
        // Mark current step as completed when moving forward
        if (step > currentStep && !completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep]);
        }
        setCurrentStep(step);
    };

    const handleNext = () => {
        if (currentStep < 5) {
            goToStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, status: "draft" }),
            });

            if (res.ok) {
                toast.success("Job saved as draft");
                router.push("/jobs");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to save job");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, status: "active" }),
            });

            if (res.ok) {
                toast.success("Job published successfully!");
                router.push("/jobs");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to publish job");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-[960px] mx-auto">
            {/* Page Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-[#333] mb-6">Create job</h1>

            {/* Wizard Card */}
            <div className="bg-white border border-[#E6E6E6] rounded shadow-sm p-6 md:p-8">
                {/* Stepper */}
                <WizardStepper currentStep={currentStep} completedSteps={completedSteps} />

                {/* Step Content */}
                {currentStep === 1 && (
                    <StepCreateForm
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleNext}
                    />
                )}

                {currentStep === 2 && (
                    <StepDetailsForm
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}

                {currentStep === 3 && (
                    <StepHiringTeamForm
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                        onSave={handleSave}
                        onPublish={handlePublish}
                    />
                )}

                {currentStep === 4 && (
                    <StepAdvertiseForm
                        formData={formData}
                        setFormData={setFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}

                {currentStep === 5 && (
                    <StepShareForm
                        formData={formData}
                        setFormData={setFormData}
                        onPublish={handlePublish}
                        onSave={handleSave}
                    />
                )}
            </div>
        </div>
    );
}
