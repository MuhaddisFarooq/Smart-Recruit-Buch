"use client";

import { useState } from "react";
import { User, Phone, MapPin, Mail, Calendar, Building2, GraduationCap, X, FileText } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetClose
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// --- Types ---

type Experience = {
    title: string;
    company: string;
    location: string;
    description: string;
    start_date: string;
    end_date: string;
    is_current: boolean | number;
};

type Education = {
    institution: string;
    major: string;
    degree: string;
    location: string;
    description: string;
    start_date: string;
    end_date: string;
    is_current: boolean | number;
};

type CandidateProfileDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: {
        name: string;
        email: string;
        phone: string;
        city: string;
        country: string;
        current_title: string;
        current_company: string;
        applied_at: string;
        status: string;
        resume_url: string;
        experience_list?: Experience[]; // Updated to accept JSON list
        education_list?: Education[];
    } | null;
};

export default function CandidateProfileDrawer({ open, onOpenChange, candidate }: CandidateProfileDrawerProps) {
    const [viewMode, setViewMode] = useState<"profile" | "resume">("profile");

    if (!candidate) return null;

    const formatDateRange = (start: string | null, end: string | null, isCurrent: boolean | number) => {
        if (!start) return "";
        const startDate = new Date(start).toLocaleDateString("en-US", { month: "short", year: "numeric" });
        if (isCurrent) return `${startDate} - Present`;
        if (!end) return startDate;
        const endDate = new Date(end).toLocaleDateString("en-US", { month: "short", year: "numeric" });
        return `${startDate} - ${endDate}`;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[800px] sm:max-w-[800px] p-0 border-l border-gray-200 shadow-2xl bg-white overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-white relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-600"></div>

                    <div className="flex gap-5 w-full pr-8">
                        <Avatar className="h-16 w-16 bg-purple-600 text-white border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-purple-600 text-xl font-medium">
                                {candidate.name ? candidate.name.substring(0, 2).toUpperCase() : "NA"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1.5 flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <SheetTitle className="text-xl font-bold text-gray-900 leading-tight">{candidate.name}</SheetTitle>
                                    <p className="text-sm text-gray-500">{candidate.current_title} at {candidate.current_company}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="capitalize border-green-200 bg-green-50 text-green-700">
                                        {candidate.status.replace('-', ' ')}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mt-2">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                    {candidate.city}, {candidate.country}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                    {candidate.phone || "No phone"}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                    <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">{candidate.email}</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <SheetClose className="absolute top-4 right-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-secondary">
                        <X className="h-5 w-5 text-gray-400" />
                        <span className="sr-only">Close</span>
                    </SheetClose>
                </div>

                {/* Main Tabs */}
                <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
                    <Tabs defaultValue="overview" className="flex-1 flex flex-col h-full">
                        <div className="px-6 border-b border-gray-200 bg-white">
                            <TabsList className="bg-transparent h-auto p-0 border-b-0 w-full justify-start rounded-none gap-8">
                                <TabsTrigger
                                    value="overview"
                                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-green-700 text-gray-500 rounded-none px-0 pb-3 text-sm font-semibold hover:text-gray-700 transition-none shadow-none"
                                >
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="screening"
                                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-green-700 text-gray-500 rounded-none px-0 pb-3 text-sm font-semibold hover:text-gray-700 transition-none shadow-none"
                                >
                                    Screening
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="overview" className="flex-1 overflow-y-auto p-0 m-0 outline-none">
                            <div className="p-6">
                                {/* Profile vs Resume Toggle */}
                                <div className="flex gap-2 mb-6">
                                    <Button
                                        variant={viewMode === 'profile' ? 'default' : 'outline'}
                                        onClick={() => setViewMode('profile')}
                                        className={`gap-2 h-9 text-xs font-semibold uppercase tracking-wide ${viewMode === 'profile' ? 'bg-[#167f39] hover:bg-[#12662d] text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <User className="h-4 w-4" /> Profile
                                    </Button>
                                    <Button
                                        variant={viewMode === 'resume' ? 'default' : 'outline'}
                                        onClick={() => setViewMode('resume')}
                                        className={`gap-2 h-9 text-xs font-semibold uppercase tracking-wide ${viewMode === 'resume' ? 'bg-[#167f39] hover:bg-[#12662d] text-white' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <FileText className="h-4 w-4" /> Resume
                                    </Button>
                                </div>

                                {viewMode === 'profile' ? (
                                    <div className="space-y-8 max-w-2xl bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                                        {/* Experience Section */}
                                        <section>
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                Experience
                                            </h3>
                                            <div className="space-y-8 relative pl-2 border-l-2 border-gray-100 ml-2">
                                                {candidate.experience_list && candidate.experience_list.length > 0 ? (
                                                    candidate.experience_list.map((exp, i) => (
                                                        <div key={i} className="relative pl-6">
                                                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-gray-200 bg-white"></div>
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className="text-base font-bold text-gray-900">{exp.title}</h4>
                                                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                                                    {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-700 mb-1">{exp.company}</div>
                                                            {exp.location && <div className="text-xs text-gray-500 mb-2">{exp.location}</div>}
                                                            {exp.description && <div className="text-sm text-gray-600 mt-2 leading-relaxed">{exp.description}</div>}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="pl-6 text-sm text-gray-400 italic">No experience listed</div>
                                                )}
                                            </div>
                                        </section>

                                        <Separator />

                                        {/* Education Section */}
                                        <section>
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4 text-gray-400" />
                                                Education
                                            </h3>
                                            <div className="space-y-6 relative pl-2 border-l-2 border-gray-100 ml-2">
                                                {candidate.education_list && candidate.education_list.length > 0 ? (
                                                    candidate.education_list.map((edu, i) => (
                                                        <div key={i} className="relative pl-6">
                                                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-gray-200 bg-white"></div>
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className="text-base font-bold text-gray-900">{edu.institution}</h4>
                                                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                                                    {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-700">{edu.degree} {edu.major ? `in ${edu.major}` : ''}</div>
                                                            {edu.description && <div className="text-sm text-gray-600 mt-2 leading-relaxed">{edu.description}</div>}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="pl-6 text-sm text-gray-400 italic">No education listed</div>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                ) : (
                                    <div className="h-[calc(100vh-250px)] min-h-[600px] w-full bg-white rounded-md border border-gray-200 overflow-hidden relative shadow-sm">
                                        {candidate.resume_url ? (
                                            (() => {
                                                const ext = candidate.resume_url.split('.').pop()?.toLowerCase();
                                                const isPDF = ext === 'pdf';
                                                const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');

                                                if (isPDF) {
                                                    return <iframe src={`${candidate.resume_url}#toolbar=0&navpanes=0&view=FitH`} className="w-full h-full border-none" title="Resume PDF" />;
                                                } else if (isImage) {
                                                    return (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={candidate.resume_url} alt="Resume" className="w-full h-full object-contain" />
                                                    );
                                                } else {
                                                    return (
                                                        <div className="text-center p-8 flex flex-col items-center justify-center h-full">
                                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                                                <FileText className="h-10 w-10 text-[#b9d36c]" />
                                                            </div>
                                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Preview not available</h3>
                                                            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                                                                This file format ({ext?.toUpperCase()}) cannot be previewed directly. Please download it to view.
                                                            </p>
                                                            <a
                                                                href={candidate.resume_url}
                                                                download
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <Button className="bg-[#b9d36c] hover:bg-[#a3bd5b] text-white font-semibold px-8 py-2.5 h-auto text-base shadow-sm">
                                                                    <FileText className="h-5 w-5 mr-2" /> Download Resume
                                                                </Button>
                                                            </a>
                                                        </div>
                                                    );
                                                }
                                            })()
                                        ) : (
                                            <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                    <FileText className="h-10 w-10 opacity-30" />
                                                </div>
                                                <p className="text-lg font-medium">No resume uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="screening" className="flex-1 overflow-y-auto p-6 m-0 outline-none">
                            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center py-20">
                                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No screening questions</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">This job post doesn't have any screening questions configured.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

            </SheetContent>
        </Sheet>
    );
}
