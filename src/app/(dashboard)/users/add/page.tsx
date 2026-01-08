"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
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

type AddUserFormData = {
    employee_id: string;
    name: string;
    department: string;
    designation: string;
    role: string;
    status: string;
    email: string;
    password: string;
};

export default function AddUserPage() {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AddUserFormData>();
    const [isLoading, setIsLoading] = useState(false);
    const [picture, setPicture] = useState<File | null>(null);
    const router = useRouter();

    const onSubmit = async (data: AddUserFormData) => {
        setIsLoading(true);
        try {
            // 1. Upload picture if selected
            let picturePath = "";
            if (picture) {
                const formData = new FormData();
                formData.append("file", picture);
                const uploadRes = await fetch("/api/uploads?folder=users", {
                    method: "POST",
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    picturePath = uploadData.fileName; // or filename, depending on API response key
                } else {
                    toast.error("Failed to upload picture");
                    setIsLoading(false);
                    return;
                }
            }

            // 2. Create User
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, picture: picturePath }),
            });

            if (res.ok) {
                toast.success("User added successfully");
                router.push("/users");
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Failed to add user");
            }
        } catch (error) {
            console.error("Error adding user:", error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Add User</CardTitle>
                    <CardDescription>Create a new user account.</CardDescription>
                </CardHeader>
                <CardContent>
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
                                <Select onValueChange={(val) => setValue("role", val)} defaultValue="user">
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
                                <Select onValueChange={(val) => setValue("status", val)} defaultValue="Active">
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
                                <Label htmlFor="password">Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Strong password"
                                    {...register("password", { required: "Password is required" })}
                                />
                                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Picture</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPicture(e.target.files?.[0] || null)}
                                    className="hidden" // hidden input, use button
                                    id="picture-upload"
                                />
                                <Label htmlFor="picture-upload" className="cursor-pointer border rounded-md p-2 flex items-center gap-2 hover:bg-muted">
                                    <Upload className="w-4 h-4" />
                                    {picture ? picture.name : "Choose File"}
                                </Label>
                                {picture ? <p className="text-sm text-green-600">Selected</p> : <p className="text-sm text-muted-foreground">No file chosen</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={isLoading} className="bg-[#b9d36c] hover:bg-[#a8c65f] text-white">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Submit
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
