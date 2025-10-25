// src/app/(dashboard)/pathology/view/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { hasPerm, type PermissionMap } from "@/lib/perms-client";
import { useConfirm } from "@/components/ui/confirm-provider";
import { notify } from "@/components/ui/notify";
import RequirePerm from "@/components/auth/RequirePerm";
import ExportButton from "@/components/common/ExportButton";

type Row = {
  id: number;
  test_name: string;
  price: number | null;
  department: string | null;
  status: "active" | "inactive";
  addedBy: string | null;
  addedDate: Date | null;
};

type ApiListResponse = {
  data: Row[];
  total: number;
  page: number;
  pageSize: number;
};

function formatAmount(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function ViewPathologyInner() {
  const { data } = useSession();
  const perms = (data?.user as any)?.perms as PermissionMap | undefined;

  const canNew = hasPerm(perms, "pathology", "new");
  const canEdit = hasPerm(perms, "pathology", "edit");
  const canDelete = hasPerm(perms, "pathology", "delete");
  const canExport = hasPerm(perms, "pathology", "export");

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const confirm = useConfirm();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const pageNumbers = useMemo(() => {
    const max = totalPages;
    const current = page;
    const span = 2;
    const start = Math.max(1, current - span);
    const end = Math.min(max, current + span);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, totalPages]);

  // Export configuration
  const exportColumns = [
    { key: "id", header: "ID", width: 10 },
    { key: "test_name", header: "Test Name", width: 30 },
    { key: "price", header: "Price", width: 15 },
    { key: "department", header: "Department", width: 20 },
    { key: "status", header: "Status", width: 15 },
  ];

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/pathology?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as ApiListResponse;
      setRows(Array.isArray(j?.data) ? j.data : []);
      setTotal(Number(j?.total || 0));
    } catch (e) {
      console.error("Failed to load pathology tests", e);
      setRows([]);
      setTotal(0);
      notify.error("Failed to load pathology tests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); // eslint-disable-next-line
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
    if (!canEdit) return;
    try {
      const res = await fetch(`/api/pathology/${id}`, {
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
    if (!canDelete) return;

    const ok = await confirm({
      title: "Delete pathology test?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      dangerous: true,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/pathology/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const remain = rows.length - 1;
      setPage(remain <= 0 && page > 1 ? Math.max(1, page - 1) : page);
      notify.success("Pathology test deleted.");
      await load();
    } catch (e) {
      console.error(e);
      notify.error("Failed to delete pathology test.");
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">View Pathology Tests</h1>
        
        <div className="flex items-center gap-2">
          {canExport && (
            <ExportButton
              data={rows}
              columns={exportColumns}
              filename="pathology_tests_export"
              title="Pathology Tests Report"
              disabled={loading}
            />
          )}
          {canNew && (
            <Link
              href="/pathology/add-new"
              className="rounded-md bg-[#c8e967] px-4 py-2 text-sm font-medium text-black hover:bg-[#b9db58]"
            >
              + Add New
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select
              className="rounded-md border px-2 py-1"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span>Search:</span>
            <input
              className="w-60 rounded-md border px-2 py-1"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-sm">
                <th className="w-16 border px-3 py-2">ID</th>
                <th className="border px-3 py-2">Test Name</th>
                <th className="border px-3 py-2">Price</th>
                <th className="border px-3 py-2">Department</th>
                <th className="border px-3 py-2">Status</th>
                <th className="w-32 border px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="border px-3 py-6 text-center text-sm">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border px-3 py-6 text-center text-sm">
                    No records
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                    <td className="border px-3 py-2 text-sm">{r.id}</td>
                    <td className="border px-3 py-2 text-sm font-medium">{r.test_name}</td>
                    <td className="border px-3 py-2 text-sm">{formatAmount(r.price)}</td>
                    <td className="border px-3 py-2 text-sm">{r.department || "—"}</td>
                    <td className="border px-3 py-2 text-sm">
                      {canEdit ? (
                        <button
                          onClick={() => toggleStatus(r.id)}
                          className={`rounded-md px-3 py-1 text-xs font-medium ${
                            r.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {r.status}
                        </button>
                      ) : (
                        <span
                          className={`rounded-md px-3 py-1 text-xs font-medium ${
                            r.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {r.status}
                        </span>
                      )}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <Link
                            href={`/pathology/${r.id}/edit`}
                            className="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                            title="Edit"
                          >
                            ✓
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => onDelete(r.id)}
                            className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                            title="Delete"
                          >
                            🗑
                          </button>
                        )}
                        {!canEdit && !canDelete && <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            Showing {rows.length ? (page - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(page * pageSize, total)} of {total} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            {pageNumbers[0] > 1 && (
              <>
                <PageBtn n={1} active={page === 1} onClick={() => setPage(1)} />
                <span className="px-1">…</span>
              </>
            )}
            {pageNumbers.map((n) => (
              <PageBtn key={n} n={n} active={page === n} onClick={() => setPage(n)} />
            ))}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                <span className="px-1">…</span>
                <PageBtn
                  n={totalPages}
                  active={page === totalPages}
                  onClick={() => setPage(totalPages)}
                />
              </>
            )}
            <button
              className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageBtn({
  n,
  active,
  onClick,
}: {
  n: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-w-[2rem] rounded-md border px-2 py-1 ${
        active ? "border-lime-600 bg-lime-600 text-white" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      {n}
    </button>
  );
}

export default function ViewPathologyPage() {
  return (
    <RequirePerm moduleKey="pathology" action="view">
      <ViewPathologyInner />
    </RequirePerm>
  );
}
