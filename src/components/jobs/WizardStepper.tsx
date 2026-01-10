"use client";

import { Check } from "lucide-react";

type Step = {
    id: number;
    label: string;
};

const STEPS: Step[] = [
    { id: 1, label: "Create" },
    { id: 2, label: "Details" },
    { id: 3, label: "Hiring Team" },
    { id: 4, label: "Advertise" },
    { id: 5, label: "Share" },
];

type WizardStepperProps = {
    currentStep: number;
    completedSteps: number[];
};

export default function WizardStepper({ currentStep, completedSteps }: WizardStepperProps) {
    return (
        <div className="flex items-center justify-center mb-8">
            {STEPS.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                const isActive = step.id === currentStep;
                const isUpcoming = !isCompleted && !isActive;

                return (
                    <div key={step.id} className="flex items-center">
                        {/* Step Circle + Label */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${isCompleted
                                        ? "bg-[#238740] text-white"
                                        : isActive
                                            ? "bg-[#238740] text-white"
                                            : "bg-white border-2 border-[#238740] text-[#238740]"
                                    }`}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    step.id
                                )}
                            </div>
                            <span
                                className={`mt-1.5 text-xs ${isActive ? "text-[#333] font-medium" : "text-[#666]"
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {index < STEPS.length - 1 && (
                            <div
                                className={`w-16 h-[2px] mx-1 -mt-5 ${completedSteps.includes(step.id) ? "bg-[#238740]" : "bg-[#E6E6E6]"
                                    }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
