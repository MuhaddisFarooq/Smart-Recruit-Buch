
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

interface JoiningFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: any;
    onSuccess: (url: string) => void;
    formType?: "joining" | "hostel" | "transport";
}

export default function JoiningFormDialog({ open, onOpenChange, candidate, onSuccess, formType = "joining" }: JoiningFormDialogProps) {
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: "",
        employee_id: "",
        cnic: "",
        designation: "",
        department: "",
        joining_date: new Date().toISOString().split('T')[0],
        contact_no: "",
        hometown: "",
    });

    useEffect(() => {
        if (candidate) {
            setFormData(prev => ({
                ...prev,
                name: candidate.name || "",
                // Try to find CNIC/Contact from user details if available, otherwise blank
                cnic: candidate.cnic || "",
                contact_no: candidate.phone || "",
                designation: candidate.job_title || "",
                department: candidate.department || "",
                hometown: candidate.city || "",
                // Keep previous manually entered values if just reopening? No, reset is safer usually, or keep if state preserved.
                // Let's reset but prioritize candidate data.
            }));
        }
    }, [candidate]);

    const handleGenerate = async () => {
        if (!formData.employee_id) {
            toast.error("Employee ID is required");
            return;
        }

        setLoading(true);
        try {
            const payload = new FormData();
            payload.append("applicationId", candidate.application_id || candidate.id);
            payload.append("data", JSON.stringify(formData));
            payload.append("type", formType);

            const res = await fetch("/api/joining-forms/generate", {
                method: "POST",
                body: payload,
            });

            if (!res.ok) throw new Error("Failed to generate joining form");

            const data = await res.json();
            toast.success("Joining form generated!");
            onSuccess(data.url);
            onOpenChange(false);
        } catch (error) {
            toast.error("Error generating joining form");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {formType === "hostel" ? "Generate Hostel Form" :
                            formType === "transport" ? "Generate Transport Form" :
                                "Generate Joining Form"}
                    </DialogTitle>
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
                        <Label>Employee ID</Label>
                        <Input
                            value={formData.employee_id}
                            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                            placeholder="e.g. 101758"
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
                    {formType === "joining" && (
                        <>
                            <div className="space-y-2">
                                <Label>CNIC</Label>
                                <Input
                                    value={formData.cnic}
                                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                                    placeholder="36103-..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact No.</Label>
                                <Input
                                    value={formData.contact_no}
                                    onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Joining</Label>
                                <Input
                                    type="date"
                                    value={formData.joining_date}
                                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                                />
                            </div>
                        </>
                    )}
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
