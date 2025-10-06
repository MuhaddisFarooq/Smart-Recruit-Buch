"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { notify } from "@/components/ui/notify";
import { useConfirm } from "@/components/ui/confirm-provider";
import { hasPerm, type PermissionMap } from "@/lib/perms-client";
import ExportButton from "@/components/common/ExportButton";

type Row = {
  id: number;
  employee_id: string | null;
  name: string | null;
  department: string | null;
  designation: string | null;
  picture: string | null;
  status: "active" | "inactive" | null;
};

function url(p?: string | null) {
  if (!p) return "";
  return p.startsWith("/") ? p : `/uploads/${p}`;
}

const PAGE_SIZE = 10;

export default function ViewUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  // Get session and permissions
  const { data: session } = useSession();
  const perms = (session?.user as any)?.perms as PermissionMap | undefined;
  const canExport = hasPerm(perms, "users", "export");

  // Export configuration
  const exportColumns = [
    { key: "id", header: "ID", width: 10 },
    { key: "employee_id", header: "Employee ID", width: 15 },
    { key: "name", header: "Name", width: 25 },
    { key: "department", header: "Department", width: 20 },
    { key: "designation", header: "Designation", width: 20 },
    { key: "status", header: "Status", width: 12 },
  ];

  async function load(p = page, term = search) {
    try {
      setLoading(true);
      const offset = (p - 1) * PAGE_SIZE;
      const limit = PAGE_SIZE;

      // Your /api/users GET expects: q, limit, offset
      const r = await fetch(
        `/api/users?q=${encodeURIComponent(term)}&limit=${limit}&offset=${offset}`,
        { cache: "no-store", credentials: "include" }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setRows(Array.isArray(j.data) ? j.data : []);
    } catch (e: any) {
      notify.error(e?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1, search);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function toggle(id: number) {
    try {
      const task = (async () => {
        const r = await fetch(`/api/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _toggleStatus: true }),
          credentials: "include",
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      })();
      await notify.promise(task, {
        loading: "Updating status…",
        success: "Status updated.",
        error: (e) => (e as Error)?.message || "Could not update status.",
      });
      load(page);
    } catch {
      /* toast handles */
    }
  }

  async function removeUser(id: number) {
    const ok = await confirm({
      title: "Delete this user?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      dangerous: true,
    });
    if (!ok) return;

    try {
      const task = (async () => {
        const r = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: "include" });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      })();
      await notify.promise(task, {
        loading: "Deleting…",
        success: "Deleted.",
        error: (e) => (e as Error)?.message || "Could not delete.",
      });
      // Optimistic UI: refetch current page
      load(page);
    } catch {
      /* toast handles */
    }
  }

  const canPrev = page > 1;
  const canNext = rows.length === PAGE_SIZE; // no total, so allow next only when page is full

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">View Users</h1>
        
        <div className="flex items-center gap-2">
          {canExport && (
            <ExportButton
              data={rows}
              columns={exportColumns}
              filename="users_export"
              title="Users Report"
              disabled={loading}
            />
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <input
          className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
          placeholder="Search by EmpID, Name, Email, Dept, Designation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link
          href="/users/add"
          className="rounded-md bg-[#c8e967] px-3 py-2 text-sm font-medium text-black hover:bg-[#b9db58]"
        >
          + Add User
        </Link>
      </div>

      <div className="overflow-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Employee ID</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Department</th>
              <th className="px-3 py-2 text-left">Designation</th>
              <th className="px-3 py-2 text-left">Picture</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No users.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-3 py-2">{r.employee_id || "—"}</td>
                  <td className="px-3 py-2">{r.name || "—"}</td>
                  <td className="px-3 py-2">{r.department || "—"}</td>
                  <td className="px-3 py-2">{r.designation || "—"}</td>
                  <td className="px-3 py-2">
                    {r.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url(r.picture)}
                        alt=""
                        className="h-10 w-10 rounded object-cover border"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {r.status === "active" ? "Active" : "InActive"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <button
                        title="Toggle status"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                        onClick={() => toggle(r.id)}
                      >
                        ●
                      </button>

                      <Link
                        href={`/users/${r.id}/edit`}
                        title="Edit"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        ✎
                      </Link>

                      <button
                        title="Delete"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700"
                        onClick={() => removeUser(r.id)}
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

      {/* Pager without total: Next enabled only when we received a full page */}
      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={!canPrev}
          onClick={() => {
            const p = Math.max(1, page - 1);
            setPage(p);
            load(p);
          }}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          Prev
        </button>
        <div className="text-sm">Page {page}</div>
        <button
          disabled={!canNext}
          onClick={() => {
            const p = page + 1;
            setPage(p);
            load(p);
          }}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
