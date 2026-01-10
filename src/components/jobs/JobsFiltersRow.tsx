"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

type JobsFiltersRowProps = {
    filters: { [key: string]: string[] };
    onFilterChange: (key: string, values: string[]) => void;
    onClearAll: () => void;
    locations: string[];
    hiringManagers: string[];
    recruiters: string[];
    statuses: string[];
    departments: string[];
};

type FilterDropdownProps = {
    label: string;
    options: { value: string; count?: number }[];
    selected: string[];
    onChange: (values: string[]) => void;
    hasSearch?: boolean;
};

function FilterDropdown({ label, options, selected, onChange, hasSearch = false }: FilterDropdownProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = hasSearch && search
        ? options.filter(opt => opt.value.toLowerCase().includes(search.toLowerCase()))
        : options;

    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const hasSelection = selected.length > 0;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`h-8 px-4 pr-7 text-sm border rounded-full flex items-center gap-1 transition-colors ${hasSelection
                        ? "border-[#238740] bg-[#238740]/5 text-[#238740]"
                        : "border-[#D1D1D1] bg-white text-[#555] hover:border-[#999]"
                    }`}
            >
                {label}
                <ChevronDown className={`absolute right-2 h-4 w-4 ${hasSelection ? "text-[#238740]" : "text-[#999]"}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-white border border-[#E6E6E6] rounded-lg shadow-lg z-30">
                    {hasSearch && (
                        <div className="p-2 border-b border-[#E6E6E6]">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search"
                                    className="w-full h-8 px-3 pr-8 text-sm border border-[#E6E6E6] rounded focus:outline-none focus:border-[#238740]"
                                />
                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999]" />
                            </div>
                        </div>
                    )}

                    <div className="max-h-[250px] overflow-y-auto py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-[#999]">No filters found</div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <label
                                    key={opt.value}
                                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#F5F5F5] cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(opt.value)}
                                        onChange={() => toggleOption(opt.value)}
                                        className="w-4 h-4 accent-[#238740] rounded"
                                    />
                                    <span className="text-sm text-[#333] flex-1">
                                        {opt.value}
                                        {opt.count !== undefined && (
                                            <span className="text-[#999] ml-1">({opt.count})</span>
                                        )}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function JobsFiltersRow({
    filters,
    onFilterChange,
    onClearAll,
    locations,
    hiringManagers,
    statuses,
    departments
}: JobsFiltersRowProps) {
    const hasActiveFilters = Object.values(filters).some(v => v && v.length > 0);

    // All options are now dynamic from actual data
    const showJobsOptions = [
        { value: "All" },
        { value: "Published" },
        { value: "Not Published" },
        { value: "Draft" },
    ];

    const locationOptions = locations.map(loc => ({ value: loc }));
    const statusOptions = statuses.map(s => ({ value: s }));
    const departmentOptions = departments.map(d => ({ value: d }));
    const hiringManagerOptions = hiringManagers.map(hm => ({ value: hm }));

    return (
        <div className="flex items-center gap-2 flex-wrap mt-4">
            <FilterDropdown
                label="Show Jobs"
                options={showJobsOptions}
                selected={filters.show_jobs || []}
                onChange={(values) => onFilterChange("show_jobs", values)}
            />
            {departmentOptions.length > 0 && (
                <FilterDropdown
                    label="Department"
                    options={departmentOptions}
                    selected={filters.department || []}
                    onChange={(values) => onFilterChange("department", values)}
                    hasSearch
                />
            )}
            {locationOptions.length > 0 && (
                <FilterDropdown
                    label="Location"
                    options={locationOptions}
                    selected={filters.location || []}
                    onChange={(values) => onFilterChange("location", values)}
                    hasSearch
                />
            )}
            {statusOptions.length > 0 && (
                <FilterDropdown
                    label="Job Status"
                    options={statusOptions}
                    selected={filters.job_status || []}
                    onChange={(values) => onFilterChange("job_status", values)}
                    hasSearch
                />
            )}
            {hiringManagerOptions.length > 0 && (
                <FilterDropdown
                    label="Hiring Manager"
                    options={hiringManagerOptions}
                    selected={filters.hiring_manager || []}
                    onChange={(values) => onFilterChange("hiring_manager", values)}
                    hasSearch
                />
            )}

            {hasActiveFilters && (
                <button
                    onClick={onClearAll}
                    className="text-sm text-[#2563EB] hover:underline ml-2 font-medium"
                >
                    Clear all
                </button>
            )}
        </div>
    );
}
