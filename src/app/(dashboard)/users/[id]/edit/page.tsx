// src/app/(dashboard)/users/[id]/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";
import type { PermissionMap, PermAction } from "@/lib/perms-client";

type UserGroup = {
  id: number;
  name: string;
  permissions: PermissionMap;
  status?: string | null;
};

type Row = {
  id: number;
  employee_id: string | null;
  name: string | null;
  department: string | null;
  designation: string | null;
  picture: string | null;
  status: "active" | "inactive" | null;
  email: string | null;
  group_id?: number | null;    // ⬅️ possible when column exists
};

function url(p?: string | null) {
  if (!p) return "";
  return p.startsWith("/") ? p : `/uploads/${p}`;
}

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employeeId, setEmployeeId]   = useState("");
  const [name, setName]               = useState("");
  const [department, setDepartment]   = useState("");
  const [designation, setDesignation] = useState("");
  const [status, setStatus]           = useState<"active" | "inactive">("active");

  const [email, setEmail]             = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [image, setImage]             = useState<File | null>(null);
  const [existingPic, setExistingPic] = useState<string | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);

  // groups
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [groupId, setGroupId] = useState<number | "">("");

  useEffect(() => {
    // load groups first (for select)
    (async () => {
      try {
        const r = await fetch("/api/user-groups", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setGroups(Array.isArray(j.data) ? j.data : []);
      } catch {
        setGroups([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/users/${id}`, { cache: "no-store", credentials: "include" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

        const d: Row = j.data;
        setEmployeeId(d.employee_id || "");
        setName(d.name || "");
        setDepartment(d.department || "");
        setDesignation(d.designation || "");
        setStatus((d.status as any) || "active");
        setExistingPic(d.picture || null);
        setPreview(url(d.picture));
        setEmail((d.email || "").toLowerCase());
        if (d.group_id !== undefined && d.group_id !== null) setGroupId(d.group_id);
      } catch (e: any) {
        notify.error(e?.message || "Failed to load user.");
        router.push("/users/view");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : url(existingPic));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId.trim() || !name.trim()) {
      return notify.error("Employee ID and Name are required.");
    }
    if (!email.trim()) {
      return notify.error("Email is required.");
    }

    try {
      setSaving(true);
      let res: Response;

      if (image) {
        const fd = new FormData();
        fd.append("employee_id", employeeId);
        fd.append("name", name);
        fd.append("department", department);
        fd.append("designation", designation);
        fd.append("status", status);
        fd.append("email", email.trim().toLowerCase()); // normalize
        if (newPassword) fd.append("password", newPassword);
        if (typeof groupId === "number") fd.append("group_id", String(groupId));
        fd.append("picture", image);
        res = await fetch(`/api/users/${id}`, { method: "PATCH", body: fd, credentials: "include" });
      } else {
        const body: any = {
          employee_id: employeeId,
          name,
          department,
          designation,
          status,
          email: email.trim().toLowerCase(), // normalize
        };
        if (newPassword) body.password = newPassword;
        if (typeof groupId === "number") body.group_id = groupId;
        res = await fetch(`/api/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        });
      }

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      notify.success("User updated.");
      router.push("/users/view");
    } catch (e: any) {
      notify.error(e?.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  const selectedGroup = useMemo(
    () => (typeof groupId === "number" ? groups.find(g => g.id === groupId) : undefined),
    [groups, groupId]
  );

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Edit User</h1>

      <form onSubmit={save} className="rounded-xl border bg-white p-5 shadow-sm max-w-3xl space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Employee ID *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Name *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Department</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Designation</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>

          {/* Group selector */}
          <div>
            <label className="mb-1 block text-sm font-medium">User Group</label>
            <select
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">— None —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email *</label>
            <input
              type="email"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">New Password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep existing"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Picture</label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-gray-50">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="h-20 w-20 object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">No image</span>
                )}
              </div>
              <input type="file" accept="image/*" onChange={onPick} />
            </div>
          </div>
        </div>

        {/* Live permissions preview */}
        {selectedGroup ? <PermissionsPreview group={selectedGroup} /> : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => history.back()}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#c8e967] px-4 py-2 text-sm font-medium text-black hover:bg-[#b9db58] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PermissionsPreview({ group }: { group: UserGroup }) {
  const entries = Object.entries(group.permissions || {});
  if (!entries.length) return null;

  const order: PermAction[] = ["view", "new", "edit", "delete", "export"];

  return (
    <div className="rounded-lg border p-4 bg-gray-50">
      <div className="font-medium mb-2 text-sm">
        Permissions for <span className="font-semibold">{group.name}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-white">
              <th className="text-left px-3 py-2">Module</th>
              {order.map((a) => (
                <th key={a} className="px-3 py-2 capitalize text-center">{a}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([mod, acts], i) => (
              <tr key={mod} className={i % 2 ? "bg-white" : "bg-gray-100/60"}>
                <td className="px-3 py-2 font-medium">{mod}</td>
                {order.map((a) => (
                  <td key={a} className="px-3 py-2 text-center">
                    {acts?.[a] ? "✓" : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
