
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Scan, MoreHorizontal, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

export type PersonApplication = {
    application_id: number;
    user_id: number;
    status: string;
    applied_at: string;
    resume_url: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    current_title: string;
    current_company: string;
    job_id: number;
    job_title: string;
    avatar_url?: string;
    designation?: string;
};

interface PeopleRowProps {
    person: PersonApplication;
    onStatusChange: (id: number, status: string) => void;
    onDelete: (id: number) => void;
    onView: (person: PersonApplication) => void;
    onAddToJob?: (person: PersonApplication) => void;
    checked?: boolean;
    onSelect?: (checked: boolean) => void;
}

export default function PeopleRow({ person, onStatusChange, onDelete, onView, onAddToJob, checked, onSelect }: PeopleRowProps) {
    const statusColors: Record<string, string> = {
        new: "text-blue-600 bg-blue-50",
        reviewed: "text-purple-600 bg-purple-50",
        interview: "text-orange-600 bg-orange-50",
        hired: "text-green-600 bg-green-50",
        rejected: "text-red-600 bg-red-50",
        withdrawn: "text-gray-600 bg-gray-50",
    };

    const statusColor = statusColors[person.status] || "text-gray-600 bg-gray-50";

    return (
        <div className="group flex items-start border-b border-gray-100 hover:bg-gray-50 transition-colors py-4 px-6 gap-4">
            {/* Checkbox */}
            <div className="pt-1">
                <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    checked={checked}
                    onChange={(e) => onSelect?.(e.target.checked)}
                />
            </div>

            {/* Column 1: Avatar + Identity */}
            <div className="flex-1 min-w-0 flex gap-4">
                <Avatar className="h-12 w-12 bg-[#5d4037] text-white text-lg rounded-full">
                    {person.avatar_url && <AvatarImage src={person.avatar_url} className="object-cover" />}
                    <AvatarFallback className="bg-[#5d4037]">
                        {person.name ? person.name.substring(0, 2).toUpperCase() : "NA"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                    <Link href={`/people/${person.application_id}`} className="font-semibold text-gray-900 text-base hover:text-green-600 hover:underline">
                        {person.name}
                    </Link>
                    <div className="text-sm text-gray-600">{person.current_title || "Candidate"}</div>
                    <div className="text-sm text-gray-500">{person.current_company || ""}</div>
                    <div className="text-xs text-gray-400 mt-1">Added to system: {new Date(person.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
            </div>

            {/* Column 2: Location */}
            <div className="w-[20%] text-sm text-gray-600">
                <div className="flex flex-col">
                    <span>{person.city || "Unknown"}</span>
                    <span>{person.country || ""}</span>
                </div>
            </div>

            {/* Column 3: Job + Status */}
            <div className="w-[25%] flex flex-col gap-1">
                <div className="text-sm font-medium text-gray-800">{person.job_title}</div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium capitalize">{person.status.replace('-', ' ')}</span>
                </div>
                <div className="text-xs text-gray-400">Status updated: {new Date(person.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>

            {/* Actions */}
            <div className="w-8 flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => onAddToJob?.(person)}>
                            Add to job
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(person.application_id)}>
                            Delete candidate
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
