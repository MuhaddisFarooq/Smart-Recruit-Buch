"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useConfirm } from "@/components/ui/confirm-provider";
import { notify } from "@/components/ui/notify";
import { hasPerm, type PermissionMap } from "@/lib/perms-client";
import ExportButton from "@/components/common/ExportButton";

type Row = {
  id: number;
  title: string;
  description_html: string | null;
  file_path: string | null;
  featured_post: 0 | 1;
  addedBy: string | null;
  addedDate: string | null;
  updatedBy: string | null;
  updatedDate: string | null;
};

type ApiListResponse = {
  data: Row[];
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZES = [10, 25, 50, 100];

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

export default function BlogsViewPage() {
  const confirm = useConfirm();

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Get session and permissions
  const { data: session } = useSession();
  const perms = (session?.user as any)?.perms as PermissionMap | undefined;
  
  const canView   = hasPerm(perms, "blogs", "view");
  const canNew    = hasPerm(perms, "blogs", "new");
  const canEdit   = hasPerm(perms, "blogs", "edit");
  const canDelete = hasPerm(perms, "blogs", "delete");
  const canExport = hasPerm(perms, "blogs", "export");

  // Export configuration
  const exportColumns = [
    { key: "id", header: "ID", width: 10 },
    { key: "title", header: "Title", width: 30 },
    { key: "featured_post", header: "Featured Post", width: 15 },
    { key: "file_path", header: "File Path", width: 25 },
    { key: "addedBy", header: "Added By", width: 20 },
    { key: "addedDate", header: "Added Date", width: 15 },
    { key: "updatedBy", header: "Updated By", width: 20 },
    { key: "updatedDate", header: "Updated Date", width: 15 },
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

      const res = await fetch(`/api/blogs?${params.toString()}`, {
        cache: "no-store",
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await res.text();
        throw new Error(
          `Unexpected response from /api/blogs (${res.status}). First bytes: ${txt.slice(
            0,
            120
          )}`
        );
      }

      const j = (await res.json()) as ApiListResponse;
      if (!res.ok) throw new Error((j as any)?.error || `HTTP ${res.status}`);
      setRows(j.data || []);
      setTotal(Number(j.total || 0));
    } catch (e: any) {
      console.error(e);
      notify.error(e?.message || "Failed to load Blogs.");
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
      setPage(1);
      loadAt(1, pageSize, search);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function onDelete(id: number) {
    const ok = await confirm({
      title: "Delete this blog post?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      dangerous: true,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      const ct = res.headers.get("content-type") || "";
      let j: any = {};
      if (ct.includes("application/json")) j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      notify.success("Deleted.");
      setRows((xs) => xs.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      if (rows.length - 1 <= 0 && page > 1) setPage(page - 1);
    } catch (e: any) {
      notify.error(e?.message || "Failed to delete blog.");
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">View Blogs</h1>
        <div className="flex items-center gap-2">
          {canExport && (
            <ExportButton
              data={rows}
              columns={exportColumns}
              filename="blogs_export"
              title="Blogs Report"
              disabled={loading}
            />
          )}
          {canNew && (
            <Link
              href="/blogs/add"
              className="rounded-md bg-[#c8e967] px-3 py-2 text-sm font-medium text-black hover:bg-[#b9db58]"
            >
              + Add Blog Post
            </Link>
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
              <option key={n} value={n}>
                {n}
              </option>
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
            placeholder="title / author…"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Featured</th>
              <th className="px-4 py-3 text-left font-medium">File</th>
              <th className="px-4 py-3 text-left font-medium">Added By</th>
              <th className="px-4 py-3 text-left font-medium">Added</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No blogs found.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3">{r.title}</td>
                  <td className="px-4 py-3">
                    {r.featured_post ? (
                      <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.file_path ? (
                      <a
                        className="text-blue-600 underline"
                        href={
                          r.file_path.startsWith("/")
                            ? r.file_path
                            : `/uploads/${r.file_path}`
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        {r.file_path.split("/").pop()}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{r.addedBy || "—"}</td>
                  <td className="px-4 py-3">{fmtDate(r.addedDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {canEdit && (
                        <Link
                          href={`/blogs/${r.id}/edit`}
                          title="Edit"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          ✎
                        </Link>
                      )}

                      {canDelete && (
                        <button
                          title="Delete"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700"
                          onClick={() => onDelete(r.id)}
                        >
                          🗑
                        </button>
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
            className="rounded-md border bg-white px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
              loadAt(p, pageSize, search);
            }}
            disabled={page <= 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const show = p <= 5 || p === totalPages || Math.abs(p - page) <= 1;
            if (!show) {
              if (p === 6 || p === totalPages - 1)
                return (
                  <span key={p} className="px-2 py-1 text-gray-400">
                    …
                  </span>
                );
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
            className="rounded-md border bg-white px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => {
              const p = Math.min(totalPages, page + 1);
              setPage(p);
              loadAt(p, pageSize, search);
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
