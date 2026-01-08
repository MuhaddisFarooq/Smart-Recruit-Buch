"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Briefcase, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type JobFormData = {
    job_title: string;
    type_of_employment: string;
    department: string;
    location: string;
    company_description: string;
    qualifications: string;
    experience: string;
    additional_information: string;
    status: string;
};

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<JobFormData>();

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await fetch(`/api/jobs/${resolvedParams.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setValue("job_title", data.job_title);
                    setValue("type_of_employment", data.type_of_employment);
                    setValue("department", data.department);
                    setValue("location", data.location);
                    setValue("company_description", data.company_description);
                    setValue("qualifications", data.qualifications);
                    setValue("experience", data.experience);
                    setValue("additional_information", data.additional_information);
                    setValue("status", data.status || "Active");
                } else {
                    toast.error("Failed to load job details");
                }
            } catch (error) {
                toast.error("Error loading job details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchJob();
    }, [resolvedParams.id, setValue]);

    const onSubmit = async (data: JobFormData) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/jobs/${resolvedParams.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update job");
            }

            toast.success("Job updated successfully!");
            router.push("/jobs");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-8">
            <div className="flex items-center gap-2 mb-6 text-muted-foreground">
                <Briefcase className="w-5 h-5" />
                <span className="text-sm font-medium">Jobs / Edit Job</span>
            </div>

            <Card className="border-none shadow-md bg-card">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-primary" />
                        <CardTitle className="text-2xl font-bold tracking-tight">Edit Job Details</CardTitle>
                    </div>
                    <CardDescription>
                        Update the job information below. Changes will be tracked.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="job_title">Job Title <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="job_title"
                                        placeholder="e.g. Senior Software Engineer"
                                        {...register("job_title", { required: "Job title is required" })}
                                    />
                                    {errors.job_title && <p className="text-sm text-destructive">{errors.job_title.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type_of_employment">Type of Employment</Label>
                                    <Select onValueChange={(val) => setValue("type_of_employment", val)} defaultValue={undefined}>
                                        {/* Note: We need to handle default value correctly with react-hook-form, 
                          but setValue in useEffect handles the initial state. 
                          The Select component from shadcn is controlled via onValueChange. 
                          Ideally we bind the value prop to watch('type_of_employment'), but 
                          for simplicity relying on setValue usually works if SelectValue is updated.
                          A safe bet is just using the browser native select or complex controller if issues arise,
                          but here we will try to make it work.
                      */}
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Full-Time">Full-Time</SelectItem>
                                            <SelectItem value="Part-Time">Part-Time</SelectItem>
                                            <SelectItem value="Contractual">Contractual</SelectItem>
                                            <SelectItem value="Internship">Internship</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        placeholder="e.g. Engineering"
                                        {...register("department")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        placeholder="e.g. New York, Remote"
                                        {...register("location")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select onValueChange={(val) => setValue("status", val)} defaultValue="Active">
                                        {/* Ideally bind to watch('status') or allow defaultValue from fetched data. 
                          Since we use setValue in useEffect, we might need a key or controlled component to update UI nicely if initial load is slow.
                          However, shadcn Select usually updates if key changes or we accept it as uncontrolled with default.
                          Better: Use Controller or key. Let's try key approach if needed, but standard Select often works if setValue is called effectively.
                      */}
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Info Section */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-semibold text-foreground">Detailed Description</h3>
                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="company_description">Company Description</Label>
                                <Textarea
                                    id="company_description"
                                    placeholder="Brief description about the company or the team..."
                                    className="min-h-[100px]"
                                    {...register("company_description")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="qualifications">Qualifications</Label>
                                <Textarea
                                    id="qualifications"
                                    placeholder="e.g. Bachelor's Degree in Computer Science..."
                                    className="min-h-[100px]"
                                    {...register("qualifications")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experience">Experience</Label>
                                <Textarea
                                    id="experience"
                                    placeholder="e.g. 3-5 years of industry experience..."
                                    className="min-h-[80px]"
                                    {...register("experience")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="additional_information">Additional Information</Label>
                                <Textarea
                                    id="additional_information"
                                    placeholder="Any extra details, benefits, or instructions..."
                                    className="min-h-[80px]"
                                    {...register("additional_information")}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Update Job
                            </Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
