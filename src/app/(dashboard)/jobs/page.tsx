"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import JobsSearchBar from "@/components/jobs/JobsSearchBar";
import JobsFiltersRow from "@/components/jobs/JobsFiltersRow";
import PipelineTableHeader from "@/components/jobs/PipelineTableHeader";
import JobRow from "@/components/jobs/JobRow";
import LoadMoreButton from "@/components/jobs/LoadMoreButton";

type Job = {
    id: number;
    job_title: string;
    location: string;
    status: string;
    hod_name?: string;
    hiring_manager?: string;
    addedBy?: string;
    department?: string;
    new_count?: number;
    in_review_count?: number;
    interview_count?: number;
    shortlisted_count?: number;
    selected_count?: number;
    offered_count?: number;
    hired_count?: number;
};

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

export default function JobsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const PAGE_SIZE = 15;

    const [userAccess, setUserAccess] = useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<number | null>(null);

    useEffect(() => {
        fetchJobs();
        fetchAccess();
    }, []);

    const fetchAccess = async () => {
        try {
            const res = await fetch("/api/auth/access");
            if (res.ok) {
                const data = await res.json();
                setUserAccess(data);
            }
        } catch (error) {
            console.error("Failed to fetch access", error);
        }
    };

    const fetchJobs = async () => {
        try {
            console.log("Fetching jobs...");
            const res = await fetch("/api/jobs");
            console.log("Jobs response status:", res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("Jobs data received:", data.length);
                setJobs(data);
            } else {
                console.error("Failed to fetch jobs:", res.status, res.statusText);
                toast.error(`Failed to load jobs: ${res.statusText}`);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
            toast.error("Network error while loading jobs");
        } finally {
            setLoading(false);
        }
    };

    // ... (existing useMemo hooks)



    // Extract unique values for dynamic filters
    const uniqueLocations = useMemo(() => {
        const locs = jobs.map(j => j.location).filter(Boolean);
        return [...new Set(locs)];
    }, [jobs]);

    const uniqueHiringManagers = useMemo(() => {
        const managers = jobs.map(j => j.hiring_manager).filter(Boolean) as string[];
        return [...new Set(managers)];
    }, [jobs]);

    const uniqueHods = useMemo(() => {
        const hods = jobs.map(j => j.hod_name).filter(Boolean) as string[];
        return [...new Set(hods)];
    }, [jobs]);

    const uniqueStatuses = useMemo(() => {
        const statuses = jobs.map(j => j.status).filter(Boolean) as string[];
        return [...new Set(statuses)];
    }, [jobs]);

    const uniqueDepartments = useMemo(() => {
        const depts = jobs.map(j => j.department).filter(Boolean) as string[];
        return [...new Set(depts)];
    }, [jobs]);

    // Dynamic filtering AND Sorting
    const filteredJobs = useMemo(() => {
        let result = [...jobs];

        // 1. Filtering Logic
        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(job =>
                job.job_title?.toLowerCase().includes(query) ||
                job.location?.toLowerCase().includes(query) ||
                job.hod_name?.toLowerCase().includes(query) ||
                job.hiring_manager?.toLowerCase().includes(query) ||
                job.addedBy?.toLowerCase().includes(query)
            );
        }

        // Show jobs filter
        if (filters.show_jobs && filters.show_jobs.length > 0) {
            result = result.filter(job => {
                const status = job.status?.toLowerCase();
                return filters.show_jobs.some(f => {
                    if (f === "All") return true;
                    if (f === "Active" || f === "Published") return status === 'active' || status === 'published';
                    if (f === "Filled") return status === 'filled';
                    if (f === "Cancelled") return status === 'cancelled';
                    if (f === "My Active") return status === 'active';
                    return true;
                });
            });
        }

        // Location filter
        if (filters.location && filters.location.length > 0) {
            result = result.filter(job =>
                filters.location.some(loc =>
                    job.location?.toLowerCase().includes(loc.toLowerCase())
                )
            );
        }

        // Hiring Manager filter
        if (filters.hiring_manager && filters.hiring_manager.length > 0) {
            result = result.filter(job =>
                filters.hiring_manager.some(hm =>
                    job.hiring_manager?.toLowerCase() === hm.toLowerCase()
                )
            );
        }

        // Job status filter
        if (filters.job_status && filters.job_status.length > 0) {
            result = result.filter(job =>
                filters.job_status.some(js =>
                    job.status?.toLowerCase() === js.toLowerCase()
                )
            );
        }

        // Department filter
        if (filters.department && filters.department.length > 0) {
            result = result.filter(job =>
                filters.department.some(dept =>
                    job.department?.toLowerCase() === dept.toLowerCase()
                )
            );
        }

        // 2. Sorting Logic
        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = (a as any)[sortConfig.key];
                const bValue = (b as any)[sortConfig.key];

                if (aValue === bValue) return 0;

                // Handle nulls always at bottom or top consistent? Usually bottom.
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (typeof aValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                } else {
                    return sortConfig.direction === 'asc'
                        ? (aValue > bValue ? 1 : -1)
                        : (aValue < bValue ? 1 : -1);
                }
            });
        }

        return result;
    }, [jobs, searchQuery, filters, sortConfig]);

    // Paginated display
    const displayedJobs = useMemo(() => {
        return filteredJobs.slice(0, page * PAGE_SIZE);
    }, [filteredJobs, page]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (key: string, values: string[]) => {
        setFilters({ ...filters, [key]: values });
        setPage(1);
    };

    const handleClearAll = () => {
        setFilters({});
        setPage(1);
        setSortConfig(null);
    };

    const handleLoadMore = () => {
        setLoadingMore(true);
        setTimeout(() => {
            setPage(page + 1);
            setLoadingMore(false);
        }, 300);
    };

    const handleJobClick = (jobId: number) => {
        router.push(`/jobs/${jobId}`);
    };

    const handleEdit = (jobId: number) => {
        router.push(`/jobs/${jobId}/edit`);
    };

    const handleUnpublish = async (jobId: number) => {
        try {
            const res = await fetch(`/api/jobs/${jobId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "draft" }),
            });

            if (res.ok) {
                toast.success("Job unpublished");
                fetchJobs();
            } else {
                toast.error("Failed to unpublish job");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDelete = (jobId: number) => {
        setJobToDelete(jobId);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!jobToDelete) return;

        try {
            const res = await fetch(`/api/jobs/${jobToDelete}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Job deleted");
                fetchJobs();
            } else {
                toast.error("Failed to delete job");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setDeleteConfirmOpen(false);
            setJobToDelete(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#238740]"></div>
            </div>
        );
    }

    const hasMore = displayedJobs.length < filteredJobs.length;

    return (
        <div className="max-w-[1100px] mx-auto">
            {/* Main Card */}
            <div className="bg-white border border-[#E6E6E6] rounded-lg shadow-sm">
                {/* Search & Filters */}
                <div className="p-5 pb-4">
                    <JobsSearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                    <JobsFiltersRow
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearAll={handleClearAll}
                        locations={uniqueLocations}
                        hiringManagers={uniqueHiringManagers}
                        hods={uniqueHods}
                        statuses={uniqueStatuses}
                        departments={uniqueDepartments}
                    />
                </div>

                {/* Table */}
                <div>
                    <PipelineTableHeader
                        totalJobs={filteredJobs.length}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />

                    {displayedJobs.length === 0 ? (
                        <div className="py-12 text-center text-[#666] text-sm">
                            {jobs.length === 0 ? (
                                <>No jobs found. <button onClick={() => router.push('/jobs/add')} className="text-[#238740] hover:underline">Create your first job</button></>
                            ) : (
                                <>No jobs match your filters. <button onClick={handleClearAll} className="text-[#238740] hover:underline">Clear filters</button></>
                            )}
                        </div>
                    ) : (
                        displayedJobs.map((job) => (
                            <JobRow
                                key={job.id}
                                job={job}
                                onClick={() => handleJobClick(job.id)}
                                onEdit={handleEdit}
                                onUnpublish={handleUnpublish}
                                onDelete={handleDelete}
                                canDelete={userAccess?.canDelete ?? false}
                            />
                        ))
                    )}
                </div>

                {/* Load More */}
                {hasMore && (
                    <LoadMoreButton onClick={handleLoadMore} loading={loadingMore} />
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the job and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                            Delete Job
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
