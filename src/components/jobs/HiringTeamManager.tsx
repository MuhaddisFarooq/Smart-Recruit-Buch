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
import { Trash2, User, Search } from "lucide-react";

type TeamMember = {
    id: number; // relationship id
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
};

const ROLES = ["Hiring Manager", "Recruiter", "Interviewer", "Executive", "Coordinator"];

export default function HiringTeamManager({ jobId }: { jobId: number }) {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
    const [selectedRole, setSelectedRole] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchTeam = async () => {
        try {
            const res = await fetch(`/api/jobs/${jobId}/team`);
            if (res.ok) {
                setTeam(await res.json());
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, [jobId]);

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

    const addToTeam = async () => {
        if (!selectedUser || !selectedRole) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/jobs/${jobId}/team`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: selectedUser.id, role: selectedRole }),
            });

            if (res.ok) {
                toast.success("Added to hiring team");
                fetchTeam();
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

    const removeFromTeam = async (userId: number) => {
        if (!confirm("Remove this user from the hiring team?")) return;
        try {
            const res = await fetch(`/api/jobs/${jobId}/team?user_id=${userId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("User removed");
                fetchTeam();
            }
        } catch (error) {
            toast.error("Failed to remove user");
        }
    };

    const updateRole = async (userId: number, newRole: string) => {
        try {
            const res = await fetch(`/api/jobs/${jobId}/team`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, role: newRole }),
            });
            if (res.ok) {
                toast.success("Role updated");
                fetchTeam();
            }
        } catch (error) {
            toast.error("Failed to update role");
        }
    };

    return (
        <div className="space-y-8">
            {/* Add New Member Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Hiring team</h3>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="relative w-full md:w-1/3">
                        <Input
                            placeholder={selectedUser ? selectedUser.name : "Name or Email"}
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
                                            setSearchResults([]);
                                        }}
                                    >
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={user.avatar_url || ""} />
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm">
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-1/3">
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Please choose a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={addToTeam}
                        disabled={!selectedUser || !selectedRole || loading}
                        className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
                    >
                        {loading ? "Adding..." : "Add to hiring team"}
                    </Button>
                </div>
            </div>

            {/* Team List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.map((member) => (
                    <div key={member.id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-start gap-3 shadow-sm">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar_url || ""} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{member.name}</h4>
                            <p className="text-sm text-gray-500 mb-2">{member.email}</p>

                            <Select value={member.role} onValueChange={(val) => updateRole(member.user_id, val)}>
                                <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => removeFromTeam(member.user_id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}

                {/* Invite Others Placeholder */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 border-dashed flex items-center gap-3 justify-center text-center">
                    <div className="space-y-1">
                        <div className="font-medium text-gray-900">Invite others!</div>
                        <p className="text-xs text-gray-500">SmartRecruiters is even more powerful when you invite others.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
