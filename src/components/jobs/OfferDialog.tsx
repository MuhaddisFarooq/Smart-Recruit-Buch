
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload, FileText } from "lucide-react";

interface OfferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: any;
    onSuccess: (url: string) => void;
}

export default function OfferDialog({ open, onOpenChange, candidate, onSuccess }: OfferDialogProps) {
    const [loading, setLoading] = useState(false);
    const [template, setTemplate] = useState("Full Time");

    // Form Data
    const [formData, setFormData] = useState({
        name: "",
        cnic: "",
        job_title: "",
        department: "General",
        salary: "",
    });

    // Custom File
    const [customFile, setCustomFile] = useState<File | null>(null);

    useEffect(() => {
        if (candidate) {
            setFormData({
                name: candidate.name || "",
                cnic: candidate.cnic || "", // Assuming cnic comes from candidate object if available
                job_title: candidate.job_title || "",
                department: candidate.department || "General",
                salary: candidate.salary_from ? `${candidate.salary_from.toLocaleString()}` : "",
            });
        }
    }, [candidate]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const payload = new FormData();
            payload.append("applicationId", candidate.application_id);
            payload.append("mode", "generate");
            payload.append("template", template);
            payload.append("data", JSON.stringify(formData));

            const res = await fetch("/api/offers/generate", {
                method: "POST",
                body: payload,
            });

            if (!res.ok) throw new Error("Failed to generate offer");

            const data = await res.json();
            toast.success("Offer generated and sent!");
            onSuccess(data.url);
            onOpenChange(false);
        } catch (error) {
            toast.error("Error generating offer");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!customFile) {
            toast.error("Please select a file");
            return;
        }

        setLoading(true);
        try {
            const payload = new FormData();
            payload.append("applicationId", candidate.application_id);
            payload.append("mode", "upload");
            payload.append("file", customFile);

            const res = await fetch("/api/offers/generate", {
                method: "POST",
                body: payload,
            });

            if (!res.ok) throw new Error("Failed to upload offer");

            const data = await res.json();
            toast.success("Custom offer uploaded and sent!");
            onSuccess(data.url);
            onOpenChange(false);
        } catch (error) {
            toast.error("Error uploading offer");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Send Offer Letter</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="generate" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="generate">Generate from Template</TabsTrigger>
                        <TabsTrigger value="upload">Upload Custom File</TabsTrigger>
                    </TabsList>

                    <TabsContent value="generate" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Template</Label>
                            <Select value={template} onValueChange={setTemplate}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Full Time">Full Time</SelectItem>
                                    <SelectItem value="Locum">Locum</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Candidate Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CNIC</Label>
                                <Input
                                    value={formData.cnic}
                                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                                    placeholder="xxxxx-xxxxxxx-x"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Designation / Job Title</Label>
                                <Input
                                    value={formData.job_title}
                                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Input
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Monthly Salary (PKR)</Label>
                                <Input
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleGenerate} disabled={loading} className="bg-[#b9d36c] hover:bg-[#a3bd5b] text-white">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                                Generate & Send
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 mb-4">Upload a verified .docx or .pdf offer letter</p>
                            <Input
                                type="file"
                                accept=".docx,.pdf"
                                onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                                className="max-w-xs"
                            />
                        </div>

                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleUpload} disabled={loading || !customFile} className="bg-[#b9d36c] hover:bg-[#a3bd5b] text-white">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                Upload & Send
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
