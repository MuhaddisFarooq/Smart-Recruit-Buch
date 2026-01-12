
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type MoveToJobDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    currentJobId: number;
    applicationId: number;
    onSuccess: () => void;
};

export default function MoveToJobDialog({ isOpen, onClose, currentJobId, applicationId, onSuccess }: MoveToJobDialogProps) {
    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchJobs();
        }
    }, [isOpen]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/jobs"); // Assuming this returns all jobs or I might need a specific endpoint
            if (res.ok) {
                const data = await res.json();
                // Filter out current job (show all other jobs regardless of status for now)
                setJobs(data.filter((j: any) => j.id !== currentJobId));
            }
        } catch (error) {
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleMove = async () => {
        if (!selectedJobId) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/job-applications/${applicationId}/move`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_job_id: selectedJobId }),
            });

            if (res.ok) {
                toast.success("Candidate moved to new job");
                onSuccess();
                onClose();
            } else {
                toast.error("Failed to move candidate");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Move Candidate to Another Job</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        Select the job you want to move this candidate to. The application will be transferred immediately.
                    </p>
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a job..." />
                            </SelectTrigger>
                            <SelectContent>
                                {jobs.map((job) => (
                                    <SelectItem key={job.id} value={String(job.id)}>
                                        {job.job_title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleMove} disabled={!selectedJobId || saving || loading} className="bg-[#167f39] hover:bg-[#12662d] text-white">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Move Candidate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
