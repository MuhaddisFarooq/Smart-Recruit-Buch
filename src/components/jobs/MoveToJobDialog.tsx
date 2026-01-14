"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function MoveToJobDialog({
    open,
    onOpenChange,
    applicationId,
    currentJobId,
    onSuccess
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    applicationId: number | null;
    currentJobId: number;
    onSuccess: () => void;
}) {
    const [jobs, setJobs] = useState<{ id: number; job_title: string }[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            fetchJobs();
            setSelectedJobId("");
        }
    }, [open]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/jobs");
            if (res.ok) {
                const data = await res.json();
                // Filter out current job
                setJobs(data.filter((j: any) => j.id !== currentJobId));
            }
        } catch (error) {
            console.error("Failed to fetch jobs");
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleMove = async () => {
        if (!applicationId || !selectedJobId) return;

        setSubmitting(true);
        try {
            // 1. Get Application Details to find User ID
            const appRes = await fetch(`/api/job-applications/${applicationId}`);
            if (!appRes.ok) throw new Error("Failed to fetch application details");
            const appData = await appRes.json();
            const userId = appData.user_id;

            // 2. Add to New Job
            // We need an endpoint to add an existing user to a job.
            // Using /api/job-applications implies creating a new application.
            // Assuming no direct endpoint, we likely need to check if we can reuse 'add candidate' or just insert directly.
            // Let's assume we can POST to /api/jobs/[id]/apply or similar, OR create a new API route /api/job-applications/move
            // But for now, let's simulate it by "Adding candidate manually" logic if possible, or just a direct INSERT if we had the API.
            // Wait, `AddCandidateDialog` uses `/api/admin/candidates/add`. Let's see if that handles existing users.
            // Actually, simplest is to create a new API action `move`.

            // Let's use a new custom endpoint for this action to be safe and atomic.
            const moveRes = await fetch("/api/job-applications/move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId: applicationId,
                    newJobId: parseInt(selectedJobId),
                    userId: userId // Optional if backend can look it up from App ID
                })
            });

            if (moveRes.ok) {
                toast.success("Candidate moved successfully");
                onSuccess();
                onOpenChange(false);
            } else {
                const err = await moveRes.json();
                toast.error(err.error || "Failed to move candidate");
            }

        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Move to Another Job</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Target Job</Label>
                        <Select value={selectedJobId} onValueChange={setSelectedJobId} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder={loading ? "Loading jobs..." : "Select a job"} />
                            </SelectTrigger>
                            <SelectContent>
                                {jobs.map((job) => (
                                    <SelectItem key={job.id} value={job.id.toString()}>
                                        {job.job_title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500">
                            The candidate will be removed from the current job and added to the selected job.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleMove} disabled={!selectedJobId || submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Move Candidate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
