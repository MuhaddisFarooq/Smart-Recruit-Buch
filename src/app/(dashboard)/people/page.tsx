"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2, Plus, ChevronDown } from "lucide-react";
import PeopleRow, { PersonApplication } from "@/components/people/PeopleRow";
import AddCandidateDialog from "@/components/jobs/AddCandidateDialog";
import CandidateProfileDrawer from "@/components/jobs/CandidateProfileDrawer";
import AddToJobDialog from "@/components/jobs/AddToJobDialog";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PeoplePage() {
    const [people, setPeople] = useState<PersonApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [limit] = useState(20);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [totalCount, setTotalCount] = useState(0);

    // Filters State
    const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
    const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState("added_to_system");

    // Selection State
    const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());

    // Facets Data
    const [facets, setFacets] = useState<{
        locations: { label: string, count: number }[],
        statuses: { label: string, count: number }[]
    }>({ locations: [], statuses: [] });

    // Drawer & Dialog State
    const [selectedPerson, setSelectedPerson] = useState<PersonApplication | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [addCandidateOpen, setAddCandidateOpen] = useState(false);

    // Add to Job State
    const [addToJobOpen, setAddToJobOpen] = useState(false);
    const [selectedForJob, setSelectedForJob] = useState<PersonApplication | null>(null);

    const fetchPeople = async (pageNum: number, search: string, locs: Set<string>, stats: Set<string>, sort: string, reset = false) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pageNum.toString(),
                limit: limit.toString(),
                search: search,
                locations: Array.from(locs).join(","),
                statuses: Array.from(stats).join(","),
                sort: sort === "last_name" ? "last_name" : "applied_at"
            });

            const res = await fetch(`/api/people?${params}`);
            if (res.ok) {
                const result = await res.json();
                const { data, meta, facets: newFacets } = result;

                if (reset) {
                    setPeople(data);
                    setSelectedCandidates(new Set());
                } else {
                    setPeople(prev => [...prev, ...data]);
                }

                setTotalCount(meta.total);
                setHasMore(data.length === limit);
                setFacets(newFacets);
            }
        } catch (error) {
            console.error("Failed to fetch people:", error);
            toast.error("Failed to load candidates");
        } finally {
            setLoading(false);
        }
    };

    // React to Poll changes
    useEffect(() => {
        setPage(1);
        fetchPeople(1, searchQuery, selectedLocations, selectedStatuses, sortBy, true);
    }, [searchQuery, selectedLocations, selectedStatuses, sortBy]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPeople(nextPage, searchQuery, selectedLocations, selectedStatuses, sortBy);
    };

    const toggleFilter = (set: Set<string>, setter: (s: Set<string>) => void, value: string) => {
        const newSet = new Set(set);
        if (newSet.has(value)) {
            newSet.delete(value);
        } else {
            newSet.add(value);
        }
        setter(newSet);
    };

    const handleSelection = (id: number, checked: boolean) => {
        const newSet = new Set(selectedCandidates);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedCandidates(newSet);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Select only currently loaded people for simplicity, or ideally all IDs if we had them.
            // For now, selecting currently visible.
            const allIds = people.map(p => p.application_id);
            setSelectedCandidates(new Set(allIds));
        } else {
            setSelectedCandidates(new Set());
        }
    };

    // Derived state for Select All checkbox
    const allSelected = people.length > 0 && people.every(p => selectedCandidates.has(p.application_id));
    const isIndeterminate = selectedCandidates.size > 0 && !allSelected;

    const handleStatusChange = async (appId: number, status: string) => {
        try {
            const res = await fetch(`/api/job-applications/${appId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                toast.success(`Status updated to ${status}`);
                // Update local state
                setPeople(prev => prev.map(p =>
                    p.application_id === appId ? { ...p, status } : p
                ));
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDelete = async (appId: number) => {
        if (!confirm("Are you sure you want to delete this application?")) return;
        try {
            const res = await fetch(`/api/job-applications/${appId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Application deleted");
                setPeople(prev => prev.filter(p => p.application_id !== appId));
                setSelectedCandidates(prev => {
                    const next = new Set(prev);
                    next.delete(appId);
                    return next;
                });
            } else {
                toast.error("Failed to delete application");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="flex h-[calc(100vh-65px)] bg-gray-50">

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Action Bar */}
                <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
                    <div className="flex-1 relative">
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search"
                            className="w-full pl-4 pr-10 bg-white"
                        />
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    {/* Updated Button Color */}
                    <Button className="bg-[#b9d36c] hover:bg-[#a3bd5b] text-white font-semibold" onClick={() => setAddCandidateOpen(true)}>
                        Add candidate
                    </Button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Filters */}
                    <div className="w-[280px] bg-white border-r border-gray-200 overflow-y-auto hidden lg:block flex-shrink-0">
                        <div className="p-4 space-y-6">
                            {/* Candidate Quick Filters */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Candidate quick filters</h3>
                                <div className="relative">
                                    <Input placeholder="Select a candidate group" className="pr-8" />
                                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Location Filter */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <span className="transform rotate-90">›</span> Location
                                    </h3>
                                </div>
                                <div className="space-y-2 pl-1 max-h-60 overflow-y-auto">
                                    {facets.locations.map((loc, idx) => (
                                        <div key={idx} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-green-600"
                                                checked={selectedLocations.has(loc.label)}
                                                onChange={() => toggleFilter(selectedLocations, setSelectedLocations, loc.label)}
                                            />
                                            <span className="text-sm text-gray-600 truncate">{loc.label} ({loc.count})</span>
                                        </div>
                                    ))}
                                    {facets.locations.length === 0 && <span className="text-xs text-gray-400 pl-1">No locations found</span>}
                                </div>
                            </div>

                            {/* Proximity Filter REMOVED here */}

                            {/* Status Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <span className="transform rotate-90">›</span> Job application status
                                </h3>
                                <div className="space-y-2 pl-1">
                                    {facets.statuses.map((status, idx) => (
                                        <div key={idx} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-green-600"
                                                checked={selectedStatuses.has(status.label)}
                                                onChange={() => toggleFilter(selectedStatuses, setSelectedStatuses, status.label)}
                                            />
                                            <span className="text-sm text-gray-600 capitalize">{status.label.replace('-', ' ')} ({status.count})</span>
                                        </div>
                                    ))}
                                    {facets.statuses.length === 0 && <span className="text-xs text-gray-400 pl-1">No statuses found</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="flex-1 overflow-y-auto bg-white">
                        {/* Control Bar */}
                        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-3 border-b border-gray-100 text-sm text-gray-600">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-green-600 h-4 w-4"
                                        checked={allSelected}
                                        ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                    <span>Select all</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span>Showing {people.length} of {totalCount}</span>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="flex items-center gap-1 cursor-pointer hover:text-gray-900 h-auto p-2 font-normal text-sm text-gray-600">
                                            Actions <span className="text-xs">▼</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem disabled={selectedCandidates.size === 0}>Add to job</DropdownMenuItem>
                                        <DropdownMenuItem disabled={selectedCandidates.size === 0}>Add tags to candidate</DropdownMenuItem>
                                        <DropdownMenuItem disabled={selectedCandidates.size === 0}>Request consent</DropdownMenuItem>
                                        <DropdownMenuItem disabled={selectedCandidates.size === 0}>Remove employee badge</DropdownMenuItem>
                                        <DropdownMenuItem disabled={selectedCandidates.size === 0} className="text-red-600">Delete candidate</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="flex items-center gap-1 cursor-pointer text-blue-600 font-medium h-auto p-2 hover:bg-transparent hover:text-blue-700">
                                            Sort by: <span className="underline">{
                                                sortBy === "added_to_system" ? "Added to system" :
                                                    sortBy === "last_name" ? "A-Z by last name" :
                                                        "Modified Date"
                                            }</span> <span className="text-xs">▼</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => setSortBy("added_to_system")}>
                                            Added to system
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortBy("last_name")}>
                                            A-Z by last name
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortBy("modified")}>
                                            Modified Date
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* List */}
                        <div>
                            {loading && page === 1 ? (
                                <div className="p-12 flex justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                                </div>
                            ) : people.length > 0 ? (
                                <>
                                    {people.map((person) => (
                                        <PeopleRow
                                            key={person.application_id}
                                            checked={selectedCandidates.has(person.application_id)}
                                            onSelect={(checked) => handleSelection(person.application_id, checked)}
                                            person={person}
                                            onStatusChange={handleStatusChange}
                                            onDelete={handleDelete}
                                            onView={(p) => {
                                                setSelectedPerson(p);
                                                setDrawerOpen(true);
                                            }}
                                            onAddToJob={(p) => {
                                                setSelectedForJob(p);
                                                setAddToJobOpen(true);
                                            }}
                                        />
                                    ))}

                                    {hasMore && (
                                        <div className="p-6 flex justify-center border-t border-gray-100 bg-gray-50">
                                            <Button
                                                variant="outline"
                                                onClick={handleLoadMore}
                                                disabled={loading}
                                                className="w-full max-w-xs border-green-600 text-green-700 hover:bg-green-50"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                Show more candidates
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="p-12 text-center text-gray-500">
                                    No candidates found matching your criteria.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Candidate Profile Drawer */}
            <CandidateProfileDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                candidate={selectedPerson as any}
                onStatusChange={(status) => {
                    if (selectedPerson) handleStatusChange(selectedPerson.application_id, status);
                }}
            />

            {/* Add Candidate Dialog - NEEDS UPDATE to support job selection */}
            <AddCandidateDialog
                open={addCandidateOpen}
                onOpenChange={setAddCandidateOpen}
                jobId={0} // 0 indicates we need to select a job
                jobTitle=""
            />

            {/* Add To Job Dialog */}
            {selectedForJob && (
                <AddToJobDialog
                    isOpen={addToJobOpen}
                    onClose={() => {
                        setAddToJobOpen(false);
                        setSelectedForJob(null);
                    }}
                    candidateId={selectedForJob.user_id}
                    candidateName={selectedForJob.name}
                    onSuccess={() => {
                        // Optional: Refresh list or show notification
                    }}
                />
            )}
        </div>
    );
}
