
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

interface AppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: any;
    onSuccess: (url: string) => void;
}

export default function AppointmentDialog({ open, onOpenChange, candidate, onSuccess }: AppointmentDialogProps) {
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: "",
        designation: "",
        department: "General",
        salary: "",
        employment_type: "Full Time",
        joining_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (candidate) {
            setFormData(prev => ({
                ...prev,
                name: candidate.name || "",
                designation: candidate.job_title || "",
                department: candidate.department || "General",
                salary: candidate.offered_salary || candidate.salary || "",
                employment_type: (() => {
                    const type = candidate.type_of_employment?.toLowerCase() || "";
                    if (type.includes("full")) return "Full Time";
                    if (type.includes("part")) return "Part Time";
                    if (type.includes("contract")) return "Contract";
                    if (type.includes("locum")) return "Locum";
                    return "Full Time";
                })(),
            }));
        }
    }, [candidate]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const payload = new FormData();
            payload.append("applicationId", candidate.application_id || candidate.id);
            payload.append("data", JSON.stringify(formData));

            const res = await fetch("/api/appointments/generate", {
                method: "POST",
                body: payload,
            });

            if (!res.ok) throw new Error("Failed to generate appointment letter");

            const data = await res.json();
            toast.success("Appointment letter generated!");
            onSuccess(data.url);
            onOpenChange(false);
        } catch (error) {
            toast.error("Error generating appointment letter");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Generate Appointment Letter</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Employee Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Designation</Label>
                        <Input
                            value={formData.designation}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Input
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Monthly Salary (PKR)</Label>
                        <Input
                            value={formData.salary}
                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Employment Type</Label>
                        <Select
                            value={formData.employment_type}
                            onValueChange={(val) => setFormData({ ...formData, employment_type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Full Time">Full Time</SelectItem>
                                <SelectItem value="Part Time">Part Time</SelectItem>
                                <SelectItem value="Contract">Contract</SelectItem>
                                <SelectItem value="Locum">Locum</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Date of Joining</Label>
                        <Input
                            type="date"
                            value={formData.joining_date}
                            onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleGenerate} disabled={loading} className="bg-[#b9d36c] hover:bg-[#a3bd5b] text-white">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                        Generate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
