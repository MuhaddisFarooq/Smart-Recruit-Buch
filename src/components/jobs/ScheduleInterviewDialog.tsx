
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type ScheduleInterviewDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    applicationId: number | null;
    onSuccess: () => void;
};

export default function ScheduleInterviewDialog({ isOpen, onClose, applicationId, onSuccess }: ScheduleInterviewDialogProps) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSchedule = async () => {
        if (!applicationId || !date || !time) {
            toast.error("Please select both date and time");
            return;
        }

        const interviewDate = new Date(`${date}T${time}`);
        if (interviewDate < new Date()) {
            toast.error("Interview date must be in the future");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/job-applications/${applicationId}/schedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interview_date: interviewDate.toISOString() }),
            });

            if (res.ok) {
                toast.success("Interview scheduled successfully");
                onSuccess();
                onClose();
            } else {
                toast.error("Failed to schedule interview");
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
                    <DialogTitle>Schedule Interview</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        Select a date and time for the interview. The candidate will be notified.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Time</label>
                            <input
                                type="time"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSchedule} disabled={saving || !date || !time} className="bg-[#167f39] hover:bg-[#12662d] text-white">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Send Invite
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
