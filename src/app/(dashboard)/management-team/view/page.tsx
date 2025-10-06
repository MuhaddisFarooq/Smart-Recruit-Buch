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
  name: string;
  designation: string;
  photo: string | null;
  status: "active" | "inactive";
};
type ApiListResponse = {
  data: Row[];
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZES = [10, 25, 50, 100];

function toPicUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  let s = String(src).trim().replace(/\\/g, "/").replace(/^public\//i, "");
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
  if (s.startsWith("uploads/")) return `/${s}`;
  if (s.startsWith("/uploads/")) return s;
  if (s.startsWith("management/")) return `/uploads/${s}`;
  if (s.includes("/")) return `/uploads/${s}`;
  return `/uploads/management/${s}`;
}

export default function ManagementTeamViewPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const confirm = useConfirm();

  // Get session and permissions
  const { data: session } = useSession();
  const perms = (session?.user as any)?.perms as PermissionMap | undefined;
  const canExport = hasPerm(perms, "management_team", "export");

  // Export configuration
  const exportColumns = [
    { key: "id", header: "ID", width: 10 },
    { key: "name", header: "Name", width: 25 },
    { key: "designation", header: "Designation", width: 25 },
    { key: "status", header: "Status", width: 12 },
  ];

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  async function loadAt(p = page, ps = pageSize, term = search) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(ps),
      });
      if (term.trim()) params.set("search", term.trim());

      const res = await fetch(`/api/management-team?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as ApiListResponse;
      setRows(Array.isArray(j?.data) ? j.data : []);
      setTotal(Number(j?.total || 0));
    } catch (e) {
      console.error("Failed to load management team", e);
      setRows([]);
      setTotal(0);
      notify.error("Failed to load team.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAt(page, pageSize, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

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
        const res = await fetch(`/api/management-team/${id}`, {
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

      await loadAt();
    } catch {
      /* toast already shown */
    }
  }

  async function onDelete(id: number) {
    const ok = await confirm({
      title: "Delete team member?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      dangerous: true,
    });
    if (!ok) return;

    try {
      const task = (async () => {
        const res = await fetch(`/api/management-team/${id}`, { method: "DELETE" });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Deleting…",
        success: "Team member deleted.",
        error: (e) => (e as Error)?.message || "Could not delete.",
      });

      // Optimistic update
      setRows((r) => r.filter((x) => x.id !== id));
      setTotal((t) => Math.max(0, t - 1));

      const remain = Math.max(0, rows.length - 1);
      const nextPage = remain <= 0 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      await loadAt(nextPage, pageSize, search);
    } catch {
      /* toast already shown */
    }
  }

  const Picture: React.FC<{ src?: string | null; alt: string }> = ({ src, alt }) => {
    const url = toPicUrl(src);
    return url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className="h-12 w-12 rounded-full object-cover border shadow-sm"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    ) : (
      <div className="h-12 w-12 rounded-full bg-gray-200 border" />
    );
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Management Team</h1>
        
        <div className="flex items-center gap-2">
          {canExport && (
            <ExportButton
              data={rows}
              columns={exportColumns}
              filename="management_team_export"
              title="Management Team Report"
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
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Designation</th>
              <th className="px-4 py-3 text-left font-medium">Photo</th>
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
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No team members found.</td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={r.id} className={idx % 2 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.designation}</td>
                  <td className="px-4 py-3">
                    <Picture src={r.photo} alt={r.name} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.status === "active"
                          ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                          : "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                      }
                    >
                      {r.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Toggle */}
                      <button
                        title="Toggle status"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                        onClick={() => toggleStatus(r.id)}
                      >
                        ●
                      </button>

                      {/* Edit (route to implement) */}
                      <Link
                        href={`/management-team/${r.id}/edit`}
                        title="Edit"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        ✎
                      </Link>

                      {/* Delete */}
                      <button
                        title="Delete"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700"
                        onClick={() => onDelete(r.id)}
                      >
                        🗑
                      </button>
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
