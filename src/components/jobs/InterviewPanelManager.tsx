
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, User, Info } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

type PanelMember = {
    id: number;
    user_id: number;
    role: string;
    name: string;
    email: string;
    avatar_url: string | null;
};

type UserResult = {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    designation?: string;
};

// ROLES constant removed as we now use dynamic designations

export default function InterviewPanelManager({ applicationId }: { applicationId: number }) {
    const [panel, setPanel] = useState<PanelMember[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
    const [selectedRole, setSelectedRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<number | null>(null);

    const fetchPanel = async () => {
        try {
            const res = await fetch(`/api/job-applications/${applicationId}/panel`);
            if (res.ok) {
                setPanel(await res.json());
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchPanel();
    }, [applicationId]);

    // Search Users
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                const res = await fetch(`/api/users/search?q=${searchQuery}`);
                if (res.ok) {
                    setSearchResults(await res.json());
                }
            } catch (error) {
                console.error(error);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const addToPanel = async () => {
        if (!selectedUser || !selectedRole) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/job-applications/${applicationId}/panel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: selectedUser.id, role: selectedRole }),
            });

            if (res.ok) {
                toast.success("Added to panel");
                fetchPanel();
                setSelectedUser(null);
                setSearchQuery("");
                setSelectedRole("");
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to add member");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveClick = (userId: number) => {
        setMemberToRemove(userId);
    };

    const confirmRemove = async () => {
        if (!memberToRemove) return;
        try {
            const res = await fetch(`/api/job-applications/${applicationId}/panel?user_id=${memberToRemove}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("User removed");
                fetchPanel();
            }
        } catch (error) {
            toast.error("Failed to remove user");
        } finally {
            setMemberToRemove(null);
        }
    };

    return (
        <div className="space-y-6">
            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Requirement: A minimum of 2 panel members must be added to mark the candidate as Selected.
                </AlertDescription>
            </Alert>

            <div className="space-y-4">
                <div className="flex flex-col gap-4">
                    <div className="relative w-full">
                        <Input
                            placeholder={selectedUser ? selectedUser.name : "Search by name or email"}
                            value={selectedUser ? "" : searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={!!selectedUser}
                            className={!!selectedUser ? "bg-gray-100" : ""}
                        />
                        {selectedUser && (
                            <button
                                onClick={() => { setSelectedUser(null); setSearchQuery(""); }}
                                className="absolute right-3 top-2.5 text-xs text-gray-500 hover:text-gray-700"
                            >
                                Clear
                            </button>
                        )}
                        {/* Search Results Dropdown */}
                        {!selectedUser && searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                {searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            // Auto-set role to designation or default
                                            setSelectedRole(user.designation || "Interviewer");
                                            setSearchResults([]);
                                        }}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar_url || ""} />
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.designation || user.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                value={selectedRole}
                                disabled
                                placeholder="Designation"
                                className="bg-gray-50 text-gray-600"
                            />
                        </div>
                        <Button
                            onClick={addToPanel}
                            disabled={!selectedUser || !selectedRole || loading}
                            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                        >
                            {loading ? "Adding..." : "Add"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Panel List */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Current Panel</h4>
                {panel.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No panel members added yet.</p>
                )}
                {panel.map((member) => (
                    <div key={member.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar_url || ""} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                                <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                            onClick={() => handleRemoveClick(member.user_id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Panel Member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this user from the interview panel?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemove} className="bg-red-600 hover:bg-red-700">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
