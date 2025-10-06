// src/app/(dashboard)/users/add/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { notify } from "@/components/ui/notify";
import type { PermissionMap, PermAction } from "@/lib/perms-client";



type UserGroup = {
  id: number;
  name: string;
  permissions: PermissionMap;
  status?: string | null;
};

export default function AddUserPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [status, setStatus] = useState<"active"|"inactive">("active");
  const [role, setRole] = useState<string>("user"); // NEW: role field
  const [email, setEmail] = useState("");       // REQUIRED
  const [password, setPassword] = useState(""); // REQUIRED
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // groups
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [groupId, setGroupId] = useState<number | "">("");

  // Get current user's role for role restrictions
  const { data: session } = useSession();
  const currentUserRole = (session?.user as any)?.role || "user";

  // Determine available roles based on current user's role
  const availableRoles = useMemo(() => {
    const roles = [];
    if (currentUserRole === "superadmin") {
      roles.push({ value: "superadmin", label: "Super Admin" });
      roles.push({ value: "admin", label: "Admin" });
      roles.push({ value: "user", label: "User" });
    } else if (currentUserRole === "admin") {
      roles.push({ value: "admin", label: "Admin" });
      roles.push({ value: "user", label: "User" });
    } else {
      roles.push({ value: "user", label: "User" });
    }
    return roles;
  }, [currentUserRole]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/user-groups", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        const arr = Array.isArray(j.data) ? (j.data as UserGroup[]) : [];
        setGroups(arr);
      } catch (e: any) {
        console.error(e);
        setGroups([]);
        notify.error(e?.message || "Failed to load user groups.");
      }
    })();
  }, []);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId.trim() || !name.trim())
      return notify.error("Employee ID and Name are required.");
    if (!email.trim())
      return notify.error("Email is required.");
    if (!password)
      return notify.error("Password is required.");

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("employee_id", employeeId.trim());
      fd.append("name", name.trim());
      fd.append("department", department);
      fd.append("designation", designation);
      fd.append("status", status);
      fd.append("role", role); // NEW: include role
      fd.append("email", email.trim().toLowerCase());
      fd.append("password", password);
      if (image) fd.append("picture", image);
      if (typeof groupId === "number") fd.append("group_id", String(groupId));

      const r = await fetch("/api/users", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      notify.success("User saved.");
      // reset
      setEmployeeId(""); setName(""); setDepartment(""); setDesignation("");
      setStatus("active"); setRole("user"); setEmail(""); setPassword("");
      setImage(null); setPreview(null); setGroupId("");
    } catch (e: any) {
      notify.error(e?.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add User</h1>
      <form onSubmit={submit} className="rounded-xl border bg-white p-5 shadow-sm max-w-3xl space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Employee ID *</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Name *</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Department</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Designation</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={designation} onChange={(e) => setDesignation(e.target.value)} />
          </div>

          {/* Role selector */}
          <div>
            <label className="mb-1 block text-sm font-medium">Role *</label>
            <select
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-gray-500">
              Current user ({currentUserRole}) can create: {availableRoles.map(r => r.label).join(", ")}
            </div>
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
            <select className="w-full rounded-md border bg-white px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* REQUIRED login fields */}
          <div>
            <label className="mb-1 block text-sm font-medium">Email *</label>
            <input type="email" className="w-full rounded-md border px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password *</label>
            <input type="password" className="w-full rounded-md border px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Picture</label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-gray-50">
                {preview ? <img src={preview} alt="" className="h-20 w-20 object-cover" /> : <span className="text-xs text-gray-400">No image</span>}
              </div>
              <input type="file" accept="image/*" onChange={onPick} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="rounded-md bg-[#c8e967] px-4 py-2 text-sm font-medium text-black hover:bg-[#b9db58] disabled:opacity-60">
          {saving ? "Saving…" : "Submit"}
        </button>
      </form>
    </div>
  );
}
