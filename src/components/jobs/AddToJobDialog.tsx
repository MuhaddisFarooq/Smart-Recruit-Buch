
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type AddToJobDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    candidateId: number; // User ID
    candidateName: string;
    onSuccess: () => void;
};

export default function AddToJobDialog({ isOpen, onClose, candidateId, candidateName, onSuccess }: AddToJobDialogProps) {
    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchJobs();
            setSelectedJobId("");
        }
    }, [isOpen]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/jobs");
            if (res.ok) {
                const data = await res.json();
                // Filter only Active jobs? For now show all
                setJobs(data);
            }
        } catch (error) {
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!selectedJobId) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/candidates/add-to-job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: candidateId,
                    job_id: selectedJobId
                }),
            });

            if (res.ok) {
                toast.success(`Candidate added to job successfully`);
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to add candidate to job");
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
                    <DialogTitle>Add {candidateName} to Job</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        Select the job you want to add this candidate to. A new application will be created.
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
                    <Button onClick={handleAdd} disabled={!selectedJobId || saving || loading} className="bg-[#b9d36c] hover:bg-[#a3bd5b] text-white">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Add to Job
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
