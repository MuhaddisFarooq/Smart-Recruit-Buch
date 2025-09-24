// src/app/(dashboard)/consultants/view/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// ✅ imports for confirm modal + toast
import { useConfirm } from "@/components/ui/confirm-provider";
import { notify } from "@/components/ui/notify";

type Row = {
  id: number;
  consultant_id: string;
  name: string;
  cat_name: string | null;
  profile_pic: string | null;
  status: "active" | "inactive";
};

type ApiListResponse = {
  data: Row[];
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZES = [10, 25, 50, 100];

/** Image path normalizer -> served URL */
function toPicUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  let s = String(src).trim().replace(/\\/g, "/").replace(/^public\//i, "");
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
  if (s.startsWith("uploads/")) return `/${s}`;
  if (s.startsWith("/uploads/")) return s;
  if (s.startsWith("consultants/")) return `/uploads/${s}`;
  if (s.includes("/")) return `/uploads/${s}`;
  return `/uploads/consultants/${s}`;
}

export default function ConsultantsViewPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ access confirm() from provider
  const confirm = useConfirm();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/consultants?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as ApiListResponse;
      setRows(Array.isArray(j?.data) ? j.data : []);
      setTotal(Number(j?.total || 0));
    } catch (e) {
      console.error("Failed to load consultants", e);
      setRows([]);
      setTotal(0);
      notify.error("Failed to load consultants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [page, pageSize]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function toggleStatus(id: number) {
    try {
      const res = await fetch(`/api/consultants/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ toggleStatus: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify.success("Status updated successfully.");
      await load();
    } catch (e) {
      console.error(e);
      notify.error("Could not toggle status.");
    }
  }

  async function onDelete(id: number) {
    // ✅ use custom confirm dialog instead of window.confirm()
    const ok = await confirm({
      title: "Delete consultant?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      dangerous: true,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/consultants/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const remain = rows.length - 1;
      setPage(remain <= 0 && page > 1 ? Math.max(1, page - 1) : page);

      notify.success("Consultant deleted successfully.");
      await load();
    } catch (e) {
      console.error(e);
      notify.error("Could not delete consultant.");
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
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">View Consultants</h1>
      </div>

      {/* Controls */}
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <select
            className="rounded-md border bg-white px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {PAGE_SIZES.map((n) => (<option key={n} value={n}>{n}</option>))}
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
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Picture</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No consultants found.</td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={r.id} className={idx % 2 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.cat_name ?? "-"}</td>
                  <td className="px-4 py-3"><Picture src={r.profile_pic} alt={r.name} /></td>
                  <td className="px-4 py-3">
                    <span className={r.status === "active"
                        ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                        : "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"}>
                      {r.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        title="Toggle status"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                        onClick={() => toggleStatus(r.id)}
                      >●</button>

                      <Link
                        href={`/consultants/${r.id}/edit`}
                        title="Edit"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                      >✎</Link>

                      <button
                        title="Delete"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700"
                        onClick={() => onDelete(r.id)}
                      >🗑</button>
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
          {rows.length > 0
            ? <>Showing <strong>{Math.min((page - 1) * pageSize + 1, total)}</strong> to{" "}
               <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong> entries</>
            : <>Showing 0 entries</>}
        </div>

        <nav className="flex items-center gap-1">
          <button className="rounded-md border bg-white px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}>
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const show = p <= 5 || p === totalPages || Math.abs(p - page) <= 1;
            if (!show) {
              if (p === 6 || p === totalPages - 1) return <span key={p} className="px-2 py-1 text-gray-400">…</span>;
              return null;
            }
            return (
              <button key={p}
                      onClick={() => setPage(p)}
                      className={p === page ? "rounded-md bg-lime-600 px-3 py-1 text-white" : "rounded-md border bg-white px-3 py-1 hover:bg-gray-50"}>
                {p}
              </button>
            );
          })}
          <button className="rounded-md border bg-white px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}>
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}
