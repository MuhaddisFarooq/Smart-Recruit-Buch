"use client";

import { useEffect } from "react";
import { ArrowRight, X, Info } from "lucide-react";

type StepDetailsFormProps = {
    formData: any;
    setFormData: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
};

const INDUSTRIES = [
    "Hospital And Health Care",
    "Technology",
    "Finance",
    "Education",
    "Manufacturing",
    "Retail",
    "Consulting",
];

const FUNCTIONS = [
    "Health Care Provider",
    "Software Development",
    "Marketing",
    "Sales",
    "Human Resources",
    "Finance",
    "Operations",
];

const EXPERIENCE_LEVELS = [
    "Entry Level",
    "Mid Level",
    "Senior Level",
    "Manager",
    "Director",
    "Executive",
];

const EMPLOYMENT_TYPES = [
    "Full-time",
    "Part-time",
    "Contract",
    "Temporary",
    "Internship",
];

const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR"];
const SALARY_PERIODS = ["Monthly", "Yearly", "Hourly", "Weekly"];

export default function StepDetailsForm({ formData, setFormData, onNext, onBack }: StepDetailsFormProps) {
    const updateField = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    // Lock Industry and Function by default
    useEffect(() => {
        if (!formData.industry) updateField("industry", "Hospital And Health Care");
        if (!formData.function) updateField("function", "Health Care Provider");
    }, []);

    return (
        <div>
            {/* Section Title */}
            <h2 className="text-lg font-semibold text-[#238740] mb-6">Add more details</h2>

            {/* Industry & Function Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm text-[#333] mb-1">
                        Industry<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={formData.industry || "Hospital And Health Care"}
                            disabled={true}
                            className="w-full h-10 px-3 pr-10 text-sm border border-[#D1D1D1] rounded focus:outline-none bg-gray-100 text-gray-500 appearance-none cursor-not-allowed"
                        >
                            <option value="Hospital And Health Care">Hospital And Health Care</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-[#333] mb-1">
                        Function<span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.function || "Health Care Provider"}
                        disabled={true}
                        className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none bg-gray-100 text-gray-500 cursor-not-allowed"
                    >
                        <option value="Health Care Provider">Health Care Provider</option>
                    </select>
                </div>
            </div>

            {/* Experience & Employment Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm text-[#333] mb-1">
                        Experience Level<span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.experience_level || ""}
                        onChange={(e) => updateField("experience_level", e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] bg-white"
                    >
                        <option value="">Select level</option>
                        {EXPERIENCE_LEVELS.map((level) => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-[#333] mb-1">
                        Type of Employment<span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.type_of_employment || ""}
                        onChange={(e) => updateField("type_of_employment", e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] bg-white"
                    >
                        <option value="">Select type</option>
                        {EMPLOYMENT_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Compensation Section */}
            <div className="mb-6">
                <h3 className="text-base font-medium text-[#333] mb-2">Compensation</h3>
                <div className="flex items-center gap-2 text-xs text-[#666] mb-4">
                    <Info className="w-3 h-3" />
                    <span>To keep the compensation private, leave the compensation fields empty.</span>
                </div>

                {/* From/To Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm text-[#333] mb-1">From</label>
                        <input
                            type="text"
                            value={formData.salary_from || ""}
                            onChange={(e) => updateField("salary_from", e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                            placeholder="Type value"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[#238740] mb-1">To</label>
                        <input
                            type="text"
                            value={formData.salary_to || ""}
                            onChange={(e) => updateField("salary_to", e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740]"
                            placeholder="Type value"
                        />
                    </div>
                </div>

                {/* Currency/Period Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-[#333] mb-1">Currency</label>
                        <select
                            value={formData.currency || ""}
                            onChange={(e) => updateField("currency", e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] bg-[#F5F5F5] text-[#999]"
                        >
                            <option value="">Please select</option>
                            {CURRENCIES.map((curr) => (
                                <option key={curr} value={curr}>{curr}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-[#333] mb-1">Salary Period</label>
                        <select
                            value={formData.salary_period || ""}
                            onChange={(e) => updateField("salary_period", e.target.value)}
                            className="w-full h-10 px-3 text-sm border border-[#D1D1D1] rounded focus:outline-none focus:border-[#238740] bg-[#F5F5F5] text-[#999]"
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
            <div className="flex items-center gap-4 pt-4 border-t border-[#E6E6E6]">
                <button
                    type="button"
                    onClick={onNext}
                    className="flex items-center gap-2 px-5 py-2 bg-[#238740] text-white text-sm font-medium rounded hover:bg-[#1d7235] transition-colors"
                >
                    Next
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
