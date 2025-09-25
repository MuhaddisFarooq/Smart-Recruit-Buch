// src/app/(dashboard)/insurance/company/add/page.tsx
"use client";

import { useState } from "react";
import { notify } from "@/components/ui/notify";

export default function AddInsuranceCompanyPage() {
  const [form, setForm] = useState({ name: "", profile: "", address: "" });
  const [logo, setLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.profile || !form.address) {
      notify.error("Please fill Name, Profile and Address.");
      return;
    }
    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("profile", form.profile);
    fd.set("address", form.address);
    if (logo) fd.set("logo", logo);

    try {
      setSaving(true);
      const task = (async () => {
        const res = await fetch("/api/insurance/company", { method: "POST", body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Saving company…",
        success: "Company saved.",
        error: (e) => (e as Error)?.message || "Could not save.",
      });

      setForm({ name: "", profile: "", address: "" });
      setLogo(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Add Insurance Company</h1>

      <form onSubmit={onSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Company name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Address</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Address"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Profile</label>
            <textarea
              className="w-full rounded-md border px-3 py-2"
              rows={4}
              value={form.profile}
              onChange={(e) => setForm({ ...form, profile: e.target.value })}
              placeholder="Short profile"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Logo</label>
            <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
          </div>
        </div>

        <div className="mt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#c8e967] px-4 py-2 font-medium text-black hover:bg-[#b9db58] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
