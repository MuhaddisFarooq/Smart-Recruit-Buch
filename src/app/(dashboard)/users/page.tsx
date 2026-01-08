"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    Pencil,
    MoreHorizontal,
    Loader2,
    Trash2,
    Ban,
    CheckCircle2,
    UserCircle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type User = {
    id: number;
    employee_id: string;
    name: string;
    department: string;
    designation: string;
    email: string;
    role: string;
    status: string;
    picture?: string;
};

export default function UsersListPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusToggle = async (user: User) => {
        const newStatus = user.status === "Active" ? "Inactive" : "Active";

        try {
            // Fetch fresh details first to be safe
            const detailRes = await fetch(`/api/users/${user.id}`);
            if (!detailRes.ok) throw new Error("Failed to fetch user details");
            const fullUser = await detailRes.json();

            // We must intentionally strip `password` key if it comes back empty/masked,
            // OR the API logic handles empty password as "no change".
            // My PUT API handles: "if (password && password.trim() !== "")" -> updates it.
            // If I send null/undefined password, it keeps old one. Correct.

            const res = await fetch(`/api/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...fullUser,
                    status: newStatus,
                    password: "" // Ensure we don't accidentally blank it if logic was different
                }),
            });

            if (res.ok) {
                toast.success(`User marked as ${newStatus}`);
                fetchUsers();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            console.error("Status update error", error);
            toast.error("Error updating status");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("User deleted successfully");
                fetchUsers();
            } else {
                toast.error("Failed to delete user");
            }
        } catch (error) {
            console.error("Delete error", error);
            toast.error("Error deleting user");
        }
    };

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage system users and their access.
                    </p>
                </div>
                <Link href="/users/add">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add New User
                    </Button>
                </Link>
            </div>

            <Card className="border-none shadow-md bg-card">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name, email, or ID..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold text-foreground w-[50px]">Picture</TableHead>
                                    <TableHead className="font-semibold text-foreground">Emp ID</TableHead>
                                    <TableHead className="font-semibold text-foreground">Name</TableHead>
                                    <TableHead className="font-semibold text-foreground">Role</TableHead>
                                    <TableHead className="font-semibold text-foreground">Department</TableHead>
                                    <TableHead className="font-semibold text-foreground">Designation</TableHead>
                                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                                    <TableHead className="font-semibold text-foreground text-right w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading users...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-muted/5">
                                            <TableCell>
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.picture ? `/uploads/${user.picture}` : ""} alt={user.name} />
                                                    <AvatarFallback><UserCircle className="w-5 h-5" /></AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{user.employee_id || "—"}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{user.role}</TableCell>
                                            <TableCell>{user.department || "—"}</TableCell>
                                            <TableCell>{user.designation || "—"}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`text-white hover:opacity-80 ${user.status === 'Inactive' ? 'bg-destructive' : 'bg-[#b9d36c]'}`}
                                                    style={user.status !== 'Inactive' ? { backgroundColor: '#b9d36c' } : {}}
                                                >
                                                    {user.status || "Active"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                                        <Link href={`/users/${user.id}/edit`}>
                                                            <DropdownMenuItem className="cursor-pointer">
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit User
                                                            </DropdownMenuItem>
                                                        </Link>

                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() => handleStatusToggle(user)}
                                                        >
                                                            {user.status === 'Inactive' ? (
                                                                <>
                                                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                                                    Mark as Active
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Ban className="mr-2 h-4 w-4 text-orange-500" />
                                                                    Mark as Inactive
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-destructive focus:text-destructive"
                                                            onClick={() => handleDelete(user.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete User
                                                        </DropdownMenuItem>

                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
