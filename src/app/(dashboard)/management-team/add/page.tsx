"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/notify";

type Form = {
  name: string;
  designation: string;
};

export default function ManagementTeamAddPage() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>({ name: "", designation: "" });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.designation.trim()) {
      notify.error("Please enter Name and Designation.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("name", form.name.trim());
      fd.set("designation", form.designation.trim());
      if (file) fd.set("image", file);

      const task = (async () => {
        const res = await fetch("/api/management-team", {
          method: "POST",
          body: fd,
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || `Failed (HTTP ${res.status})`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Saving team member…",
        success: "Team member added.",
        error: (e) => (e as Error)?.message || "Could not save.",
      });

      // reset
      setForm({ name: "", designation: "" });
      setFile(null);
      setPreview(null);
    } catch {
      /* toast already shown */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Add Team Member</h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter the team member’s details. Image is optional and will be optimized automatically.
      </p>

      <form onSubmit={onSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input
              placeholder="Enter full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Designation</label>
            <Input
              placeholder="Enter designation"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-white file:px-3 file:py-2"
            />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                className="mt-3 h-28 w-28 rounded-lg border object-cover shadow-sm"
              />
            )}
          </div>
        </div>

        <div className="mt-4">
          <Button
            type="submit"
            disabled={saving || !form.name.trim() || !form.designation.trim()}
            className="bg-[#c8e967] text-black hover:bg-[#b9db58] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
