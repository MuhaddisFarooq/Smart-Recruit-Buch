// src/app/(dashboard)/careers/view/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { notify } from "@/components/ui/notify";
import { useConfirm } from "@/components/ui/confirm-provider";
import { hasPerm, type PermissionMap } from "@/lib/perms-client";
import ExportButton from "@/components/common/ExportButton";

type Row = {
  id: number;
  job_title: string;
  type_of_employment: string;
  department: string | null;
  status: "active" | "inactive";
};

type ApiListResponse = {
  data: Row[];
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZES = [10, 25, 50, 100];

export default function CareersViewPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const confirm = useConfirm();
  const { data: session } = useSession();
  const perms = (session?.user as any)?.perms as PermissionMap | undefined;

  // Check if user has view permission
  const canView = hasPerm(perms, "careers", "view");
  const canEdit = hasPerm(perms, "careers", "edit");
  const canDelete = hasPerm(perms, "careers", "delete");
  const canExport = hasPerm(perms, "careers", "export");

  // Export configuration
  const exportColumns = [
    { key: "id", header: "ID", width: 10 },
    { key: "job_title", header: "Job Title", width: 25 },
    { key: "type_of_employment", header: "Employment Type", width: 20 },
    { key: "department", header: "Department", width: 20 },
    { key: "status", header: "Status", width: 12 },
  ];

  // If no view permission, show access denied message
  if (session && !canView) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view careers.</p>
        </div>
      </div>
    );
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  /** Load helper that accepts explicit args to avoid setState timing/race issues */
  async function loadAt(p = page, ps = pageSize, term = search) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(ps),
      });
      if (term.trim()) params.set("search", term.trim());

      const res = await fetch(`/api/careers?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as ApiListResponse;
      setRows(Array.isArray(j?.data) ? j.data : []);
      setTotal(Number(j?.total || 0));
    } catch (e) {
      console.error("Failed to load careers", e);
      setRows([]);
      setTotal(0);
      notify.error("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  // initial + page/pageSize changes
  useEffect(() => {
    loadAt(page, pageSize, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      const next = 1;
      setPage(next);
      loadAt(next, pageSize, search);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function toggleStatus(id: number) {
    try {
      const task = (async () => {
        const res = await fetch(`/api/careers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toggleStatus: true }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Updating status…",
        success: "Status updated.",
        error: (e) => (e as Error)?.message || "Could not toggle status.",
      });

      await loadAt(); // refresh current view
    } catch {
      /* toast already shown */
    }
  }

  async function onDelete(id: number) {
    const ok = await confirm({
      title: "Delete job?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      dangerous: true,
    });
    if (!ok) return;

    try {
      const task = (async () => {
        const res = await fetch(`/api/careers/${id}`, { method: "DELETE" });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Deleting…",
        success: "Job deleted.",
        error: (e) => (e as Error)?.message || "Could not delete job.",
      });

      // Optimistically remove it from UI immediately
      setRows((r) => r.filter((x) => x.id !== id));
      setTotal((t) => Math.max(0, t - 1));

      // If last item on the page was removed, go back a page
      const remain = Math.max(0, rows.length - 1);
      const nextPage = remain <= 0 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);

      // Ensure we refresh using the page we intend to show
      await loadAt(nextPage, pageSize, search);
    } catch {
      /* toast already shown */
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">View Jobs</h1>
        
        <div className="flex items-center gap-2">
          {canExport && (
            <ExportButton
              data={rows}
              columns={exportColumns}
              filename="careers_export"
              title="Careers Report"
              disabled={loading}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <select
            className="rounded-md border bg-white px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => {
              const ps = Number(e.target.value);
              setPageSize(ps);
              setPage(1);
              loadAt(1, ps, search);
            }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-sm">entries</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
            placeholder="type to search…"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Job Title</th>
              <th className="px-4 py-3 text-left font-medium">Employment</th>
              <th className="px-4 py-3 text-left font-medium">Department</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No jobs found.</td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={r.id} className={idx % 2 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3">{r.job_title}</td>
                  <td className="px-4 py-3">{r.type_of_employment}</td>
                  <td className="px-4 py-3">{r.department ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.status === "active"
                          ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                          : "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                      }
                    >
                      {r.status === "active" ? "Active" : "InActive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Toggle status - requires edit permission */}
                      {canEdit && (
                        <button
                          title="Toggle status"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                          onClick={() => toggleStatus(r.id)}
                        >
                          ●
                        </button>
                      )}

                      {/* Edit button - requires edit permission */}
                      {canEdit && (
                        <Link
                          href={`/careers/${r.id}/edit`}
                          title="Edit"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          ✎
                        </Link>
                      )}

                      {/* Delete button - requires delete permission */}
                      {canDelete && (
                        <button
                          title="Delete"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700"
                          onClick={() => onDelete(r.id)}
                        >
                          🗑
                        </button>
                      )}

                      {/* Show message when no actions available */}
                      {!canEdit && !canDelete && (
                        <span className="text-gray-400 text-sm">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3 flex flex-col items-start justify-between gap-3 text-sm text-gray-600 md:flex-row md:items-center">
        <div>
          {rows.length > 0 ? (
            <>
              Showing <strong>{Math.min((page - 1) * pageSize + 1, total)}</strong> to{" "}
              <strong>{Math.min(page * pageSize, total)}</strong> of{" "}
              <strong>{total}</strong> entries
            </>
          ) : (
            <>Showing 0 entries</>
          )}
        </div>

        <nav className="flex items-center gap-1">
          <button
            className="rounded-md border bg-white px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              loadAt(next, pageSize, search);
            }}
            disabled={page <= 1}
          >
            Previous
          </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const show = p <= 5 || p === totalPages || Math.abs(p - page) <= 1;
              if (!show) {
                if (p === 6 || p === totalPages - 1) {
                  return <span key={p} className="px-2 py-1 text-gray-400">…</span>;
                }
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => {
                    setPage(p);
                    loadAt(p, pageSize, search);
                  }}
                  className={
                    p === page
                      ? "rounded-md bg-lime-600 px-3 py-1 text-white"
                      : "rounded-md border bg-white px-3 py-1 hover:bg-gray-50"
                  }
                >
                  {p}
                </button>
              );
            })}

          <button
            className="rounded-md border bg-white px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              const next = Math.min(totalPages, page + 1);
              setPage(next);
              loadAt(next, pageSize, search);
            }}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}
