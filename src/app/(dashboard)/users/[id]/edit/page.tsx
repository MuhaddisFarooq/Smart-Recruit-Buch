"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type EditUserFormData = {
    employee_id: string;
    name: string;
    department: string;
    designation: string;
    role: string;
    status: string;
    email: string;
    password?: string; // Optional for edit
};

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditUserFormData>();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [picture, setPicture] = useState<File | null>(null);
    const [currentPicture, setCurrentPicture] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const { id } = await params;
            setUserId(id);
            const res = await fetch(`/api/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setValue("employee_id", data.employee_id);
                setValue("name", data.name);
                setValue("department", data.department);
                setValue("designation", data.designation);
                setValue("role", data.role);
                setValue("status", data.status);
                setValue("email", data.email);
                setCurrentPicture(data.picture);
            } else {
                toast.error("Failed to load user");
            }
        } catch (error) {
            console.error("Error loading user:", error);
            toast.error("Error loading user");
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: EditUserFormData) => {
        if (!userId) return;
        setIsSaving(true);
        try {
            // 1. Upload new picture if selected
            let picturePath = currentPicture;
            if (picture) {
                const formData = new FormData();
                formData.append("file", picture);
                const uploadRes = await fetch("/api/uploads?folder=users", {
                    method: "POST",
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    picturePath = uploadData.fileName;
                } else {
                    toast.error("Failed to upload picture");
                    setIsSaving(false);
                    return;
                }
            }

            // 2. Update User
            const payload = { ...data, picture: picturePath };
            if (!payload.password) delete payload.password; // Don't send empty password

            const res = await fetch(`/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("User updated successfully");
                router.push("/users");
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Failed to update user");
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="container max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">Edit User</h1>
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employee_id">Employee ID *</Label>
                                <Input
                                    id="employee_id"
                                    placeholder="e.g. EMP001"
                                    {...register("employee_id", { required: "Employee ID is required" })}
                                />
                                {errors.employee_id && <p className="text-red-500 text-sm">{errors.employee_id.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Full Name"
                                    {...register("name", { required: "Name is required" })}
                                />
                                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    placeholder="e.g. IT, HR"
                                    {...register("department")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="designation">Designation</Label>
                                <Input
                                    id="designation"
                                    placeholder="e.g. Manager"
                                    {...register("designation")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role *</Label>
                                {/* Using the standard select properly with hook form requires controller or controlled component pattern.
                                    Here we use defaultValue + setValue/useEffect simplistically but robustly.
                                */}
                                <Select onValueChange={(val) => setValue("role", val)} defaultValue={watch("role")}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="superadmin">Super Admin</SelectItem>
                                        <SelectItem value="hr">HR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select onValueChange={(val) => setValue("status", val)} defaultValue={watch("status") || "Active"}>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    {...register("email", { required: "Email is required" })}
                                />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Leave blank to keep existing"
                                    {...register("password")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Picture</Label>
                            <div className="flex items-center gap-4">
                                {currentPicture && !picture && (
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={`/uploads/${currentPicture}`} />
                                        <AvatarFallback>PIC</AvatarFallback>
                                    </Avatar>
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPicture(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="picture-edit-upload"
                                />
                                <Label htmlFor="picture-edit-upload" className="cursor-pointer border rounded-md p-2 flex items-center gap-2 hover:bg-muted">
                                    <Upload className="w-4 h-4" />
                                    {picture ? picture.name : (currentPicture ? "Change File" : "Choose File")}
                                </Label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={isSaving} className="bg-[#b9d36c] hover:bg-[#a8c65f] text-white">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Save
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
