"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GroupRow = {
  id: number;
  name: string;
  addedBy: string | null;
  addedDate: string | null;
  updatedBy: string | null;
  updatedDate: string | null;
  modulesWithAccess: number; // <— changed
};

export default function ViewUserGroupsPage() {
  const [rows, setRows] = useState<GroupRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load(term = "") {
    try {
      setLoading(true);
      setErr(null);
      const r = await fetch(`/api/user-groups?q=${encodeURIComponent(term)}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setRows(j.data || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load groups.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(""); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  async function removeGroup(id: number) {
    if (!confirm("Delete this group? This cannot be undone.")) return;
    const r = await fetch(`/api/user-groups/${id}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return alert(j?.error || `HTTP ${r.status}`);
    setRows(prev => prev.filter(x => x.id !== id));
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User Groups</h1>
        <Link href="/users/groups/add" className="rounded-md bg-[#c8e967] px-4 py-2 text-sm font-medium text-black hover:bg-[#b9db58]">
          + Add Group
        </Link>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <input
          className="w-full max-w-xs rounded-md border px-3 py-2 text-sm"
          placeholder="Search group name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50" onClick={() => { setSearch(""); load(""); }}>
          Clear
        </button>
      </div>

      {err && <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

      <div className="overflow-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Group Name</th>
              <th className="px-3 py-2 text-left">Permissions</th>
              <th className="px-3 py-2 text-left">Added</th>
              <th className="px-3 py-2 text-left">Updated</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">No groups found.</td></tr>
            ) : (
              rows.map((g, i) => (
                <tr key={g.id} className={i % 2 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-3 py-2 font-medium">{g.name}</td>
                  <td className="px-3 py-2">{g.modulesWithAccess ?? 0} module(s)</td>
                  <td className="px-3 py-2">
                    <div className="text-gray-800">{g.addedBy || "—"}</div>
                    <div className="text-xs text-gray-500">{g.addedDate || "—"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-gray-800">{g.updatedBy || "—"}</div>
                    <div className="text-xs text-gray-500">{g.updatedDate || "—"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Link href={`/users/groups/${g.id}/edit`} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700" title="Edit">✎</Link>
                      <button onClick={() => removeGroup(g.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700" title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
