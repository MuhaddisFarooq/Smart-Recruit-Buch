"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
    Plus,
    Search,
    Eye,
    Pencil,
    MoreHorizontal,
    Loader2,
    Trash2,
    Ban,
    CheckCircle2
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Job = {
    id: number;
    job_title: string;
    type_of_employment: string;
    department: string;
    location: string;
    addedBy: string;
    addedDate: string;
    status: string;
};

export default function JobsListPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const isCandidate = (session?.user as any)?.role === 'candidate';

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/jobs");
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusToggle = async (job: Job) => {
        const newStatus = job.status === "Active" ? "Inactive" : "Active";

        try {
            // We need to send the full body because the PUT endpoint expects it.
            // Ideally we should use PATCH for partial updates, but reusing PUT is faster here.
            // We use the job object we already have. 
            // Note: date fields and addedBy are ignored/handled by backend or not needed in body for update usually if backend doesn't overwrite them with null.
            // Our backend overwrites all fields provided.
            // Wait, our local 'job' object might check omitted fields?
            // The list API returns: id, job_title, type_of_employment, department, location, addedBy, addedDate, status.
            // It MISSES matching fields for PUT: company_description, qualifications, experience, additional_information.

            // IF we use PUT with missing fields, they might be set to undefined/null in DB!
            // We must fetch the single job first OR update the API to support partials.
            // Updating API for partials is better, but let's try just patching this locally by fetching first if needed.
            // OR simpler: Just create a specialized server action or API route.
            // Actually, let's just fetch the detail first to be safe, then update.

            // Fetch validation:
            const detailRes = await fetch(`/api/jobs/${job.id}`);
            if (!detailRes.ok) throw new Error("Failed to fetch job details for update");
            const fullJob = await detailRes.json();

            const res = await fetch(`/api/jobs/${job.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...fullJob,
                    status: newStatus
                }),
            });

            if (res.ok) {
                toast.success(`Job marked as ${newStatus}`);
                fetchJobs();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            console.error("Status update error", error);
            toast.error("Error updating status");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this job?")) return;

        try {
            const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Job deleted successfully");
                fetchJobs(); // Refresh list
            } else {
                toast.error("Failed to delete job");
            }
        } catch (error) {
            console.error("Delete error", error);
            toast.error("Error deleting job");
        }
    };

    const filteredJobs = jobs.filter((job) =>
        job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRowClick = (id: number) => {
        if (isCandidate) {
            router.push(`/jobs/${id}`);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and view all job openings.
                    </p>
                </div>
                {!isCandidate && (
                    <Link href="/jobs/add">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Add New Job
                        </Button>
                    </Link>
                )}
            </div>

            <Card className="border-none shadow-md bg-card">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by title or department..."
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
                                    <TableHead className="font-semibold text-foreground">Job Title</TableHead>
                                    <TableHead className="font-semibold text-foreground">Type</TableHead>
                                    <TableHead className="font-semibold text-foreground">Department</TableHead>
                                    <TableHead className="font-semibold text-foreground">Location</TableHead>
                                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                                    {!isCandidate && <TableHead className="font-semibold text-foreground text-right w-[100px]">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={isCandidate ? 5 : 6} className="h-24 text-center">
                                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading jobs...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredJobs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={isCandidate ? 5 : 6} className="h-24 text-center text-muted-foreground">
                                            No jobs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredJobs.map((job) => (
                                        <TableRow
                                            key={job.id}
                                            className={`hover:bg-muted/5 ${isCandidate ? 'cursor-pointer' : ''}`}
                                            onClick={() => handleRowClick(job.id)}
                                        >
                                            <TableCell className="font-medium">{job.job_title}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                                                    {job.type_of_employment || "N/A"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{job.department || "—"}</TableCell>
                                            <TableCell className="text-muted-foreground">{job.location || "—"}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`text-white hover:opacity-80 ${job.status === 'Inactive' ? 'bg-destructive' : 'bg-[#b9d36c]'}`}
                                                    style={job.status !== 'Inactive' ? { backgroundColor: '#b9d36c' } : {}}
                                                >
                                                    {job.status || "Active"}
                                                </Badge>
                                            </TableCell>
                                            {!isCandidate && (
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                                            <Link href={`/jobs/${job.id}`}>
                                                                <DropdownMenuItem className="cursor-pointer">
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                            </Link>

                                                            {/* Assuming we might want a separate Edit page, or re-use Add page logic. 
                                For now, I'll point to an edit route. */}
                                                            <Link href={`/jobs/${job.id}/edit`}>
                                                                <DropdownMenuItem className="cursor-pointer">
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit Job
                                                                </DropdownMenuItem>
                                                            </Link>

                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => handleStatusToggle(job)}
                                                            >
                                                                {job.status === 'Inactive' ? (
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
                                                                onClick={() => handleDelete(job.id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Job
                                                            </DropdownMenuItem>

                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            )}
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
