"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MODULES } from "@/lib/modules";

type Perm = { new: boolean; edit: boolean; delete: boolean; view: boolean; export: boolean; import: boolean };

export default function EditUserGroupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [perms, setPerms] = useState<Record<string, Perm>>({});

  const emptyPerms = useMemo(() => {
    const obj: Record<string, Perm> = {};
    MODULES.forEach((m) => (obj[m.key] = { new: false, edit: false, delete: false, view: false, export: false, import: false }));
    return obj;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/user-groups/${id}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

        const g = j.data.group as { name: string };
        const p = (j.data.permissions || {}) as Record<string, Perm>;

        const merged = { ...emptyPerms };
        for (const k of Object.keys(p)) merged[k] = { ...emptyPerms[k], ...p[k] };

        setName(g.name || "");
        setPerms(merged);
      } catch (e: any) {
        setErr(e?.message || "Failed to load group.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, emptyPerms]);

  function toggle(mod: string, key: keyof Perm) {
    setPerms((prev) => ({ ...prev, [mod]: { ...prev[mod], [key]: !prev[mod][key] } }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setErr("Group name is required.");

    try {
      setSaving(true);
      setErr(null);

      const filtered: Record<string, Partial<Perm>> = {};
      for (const [k, v] of Object.entries(perms)) {
        if (v.new || v.edit || v.delete || v.view || v.export) filtered[k] = v;
      }

      const r = await fetch(`/api/user-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), permissions: filtered }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      router.push("/users/groups/view");
    } catch (e: any) {
      setErr(e?.message || "Failed to save group.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit User Group</h1>
        <Link href="/users/groups/view" className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">Back</Link>
      </div>

      {err && <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

      <form onSubmit={save} className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Group Name *</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">Permissions</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => {
              const v = perms[m.key];
              return (
                <div key={m.key} className="rounded-lg border p-3">
                  <div className="mb-2 font-medium">{m.label}</div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={v.view} onChange={() => toggle(m.key, "view")} />
                      View
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={v.new} onChange={() => toggle(m.key, "new")} />
                      New
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={v.edit} onChange={() => toggle(m.key, "edit")} />
                      Edit
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={v.delete} onChange={() => toggle(m.key, "delete")} />
                      Delete
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={v.export} onChange={() => toggle(m.key, "export")} />
                      Export
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={v.import} onChange={() => toggle(m.key, "import")} />
                      Import
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/users/groups/view" className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={saving} className="rounded-md bg-[#c8e967] px-4 py-2 text-sm font-medium text-black hover:bg-[#b9db58] disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
