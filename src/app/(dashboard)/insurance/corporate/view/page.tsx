"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notify } from "@/components/ui/notify";
import { useConfirm } from "@/components/ui/confirm-provider";

type Row = { id: number; name: string; profile: string; address: string; logo: string | null; };
type ApiListResponse = { data: Row[]; total: number; page: number; pageSize: number };
const PAGE_SIZES = [10, 25, 50, 100];

export default function ViewInsuranceCorporatePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  async function loadAt(p = page, ps = pageSize, q = search) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(ps) });
      if (q.trim()) params.set("search", q.trim());
      const res = await fetch(`/api/insurance/corporate?${params.toString()}`, { cache: "no-store" });
      const j = (await res.json()) as ApiListResponse;
      setRows(Array.isArray(j?.data) ? j.data : []);
      setTotal(Number(j?.total || 0));
    } catch {
      notify.error("Failed to load corporate entries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAt(page, pageSize, search); /* eslint-disable-next-line */ }, [page, pageSize]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); loadAt(1, pageSize, search); }, 350); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);

  async function onDelete(id: number) {
    const ok = await confirm({
      title: "Delete corporate?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      dangerous: true,
    });
    if (!ok) return;

    try {
      const task = (async () => {
        const res = await fetch(`/api/insurance/corporate/${id}`, { method: "DELETE" });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Deleting…",
        success: "Deleted.",
        error: (e) => (e as Error)?.message || "Could not delete.",
      });

      setRows((r) => r.filter((x) => x.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      const remain = Math.max(0, rows.length - 1);
      const nextPage = remain <= 0 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      await loadAt(nextPage, pageSize, search);
    } catch { /* toast already shown */ }
  }

  const logoUrl = (s?: string | null) => (!s ? undefined : s.startsWith("/") ? s : `/uploads/${s}`);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">View Insurance Corporate</h1>

      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <select
            className="rounded-md border bg-white px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => { const ps = Number(e.target.value); setPageSize(ps); setPage(1); loadAt(1, ps, search); }}
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

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Profile</th>
              <th className="px-4 py-3 text-left font-medium">Address</th>
              <th className="px-4 py-3 text-left font-medium">Logo</th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No corporate entries.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id} className={i % 2 ? "bg-white" : "bg-gray-50/50"}>
                <td className="px-4 py-3">{r.id}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3"><div className="max-w-[420px] truncate">{r.profile || "-"}</div></td>
                <td className="px-4 py-3">{r.address}</td>
                <td className="px-4 py-3">
                  {r.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl(r.logo)} alt={r.name} className="h-10 w-10 rounded object-cover border" />
                  ) : <span>-</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/insurance/corporate/${r.id}/edit`}
                      title="Edit"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >✎</Link>
                    <button
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700"
                      title="Delete"
                      onClick={() => onDelete(r.id)}
                    >🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-col items-start justify-between gap-3 text-sm text-gray-600 md:flex-row md:items-center">
        <div>
          {rows.length > 0
            ? <>Showing <strong>{Math.min((page - 1) * pageSize + 1, total)}</strong> to{" "}
                 <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong> entries</>
            : <>Showing 0 entries</>}
        </div>
        <nav className="flex items-center gap-1">
          <button className="rounded-md border bg-white px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => { const next = Math.max(1, page - 1); setPage(next); loadAt(next, pageSize, search); }}
            disabled={page <= 1}>Previous</button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const show = p <= 5 || p === totalPages || Math.abs(p - page) <= 1;
            if (!show) { if (p === 6 || p === totalPages - 1) return <span key={p} className="px-2 py-1 text-gray-400">…</span>; return null; }
            return (
              <button key={p}
                onClick={() => { setPage(p); loadAt(p, pageSize, search); }}
                className={p === page ? "rounded-md bg-lime-600 px-3 py-1 text-white" : "rounded-md border bg-white px-3 py-1 hover:bg-gray-50"}>
                {p}
              </button>
            );
          })}
          <button className="rounded-md border bg-white px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => { const next = Math.min(totalPages, page + 1); setPage(next); loadAt(next, pageSize, search); }}
            disabled={page >= totalPages}>Next</button>
        </nav>
      </div>
    </div>
  );
}
