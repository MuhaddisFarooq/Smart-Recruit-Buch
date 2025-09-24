// src/app/(dashboard)/achievements/view/page.tsx
"use client";

import { useEffect, useState } from "react";
import { notify } from "@/components/ui/notify";
import { useConfirm } from "@/components/ui/confirm-provider";

type Row = {
  id: number;
  image: string;       // stored like achievements/<file>.jpg
  addedBy?: string;
  addedDate?: string;
};

function toUrl(rel: string) {
  let s = String(rel || "").replace(/\\/g, "/");
  if (s.startsWith("/uploads/")) return s;
  if (s.startsWith("uploads/")) return `/${s}`;
  return `/uploads/${s}`;
}

export default function AchievementsViewPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/achievements", { cache: "no-store" });
      const j = await r.json();
      setRows(Array.isArray(j?.data) ? j.data : []);
    } catch (e) {
      console.error(e);
      notify.error("Failed to load achievements.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function del(id: number) {
    const ok = await confirm({
      title: "Delete image?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      dangerous: true,
    });
    if (!ok) return;

    try {
      const task = (async () => {
        const r = await fetch(`/api/achievements/${id}`, { method: "DELETE" });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Deleting…",
        success: "Deleted.",
        error: (e) => (e as Error)?.message || "Could not delete.",
      });

      // Optimistic UI
      setRows((rs) => rs.filter((x) => x.id !== id));
    } catch {
      /* toast already shown */
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Achievements</h1>

      {loading ? (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-500 shadow-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-500 shadow-sm">No achievements yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {rows.map((r) => (
            <div key={r.id} className="group relative overflow-hidden rounded-xl border bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toUrl(r.image)} alt={`Achievement ${r.id}`} className="h-56 w-full object-cover" />
              <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                <button
                  title="Delete"
                  onClick={() => del(r.id)}
                  className="rounded-full bg-rose-600 px-3 py-1 text-sm font-medium text-white hover:bg-rose-700"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
