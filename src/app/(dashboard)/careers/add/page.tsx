"use client";

import { useState } from "react";
import { notify } from "@/components/ui/notify";

type Form = {
  job_title: string;
  department: string;
  type_of_employment: string;
  location: string;
  job_link: string;
};

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contractual"];
const LOCATIONS = ["Multan, Pakistan"];

export default function AddCareerPage() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>({
    job_title: "",
    department: "",
    type_of_employment: "",
    location: "",
    job_link: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.job_title ||
      !form.department ||
      !form.type_of_employment ||
      !form.location
    ) {
      notify.error("Please fill all required fields.");
      return;
    }

    setSaving(true);
    try {
      const task = (async () => {
        const res = await fetch("/api/careers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, status: "active" }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Saving job…",
        success: "Career saved!",
        error: (e) => (e as Error)?.message || "Failed to save.",
      });

      setForm({
        job_title: "",
        department: "",
        type_of_employment: "",
        location: "",
        job_link: "",
      });
    } catch {
      // error already shown via toast above
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Add New Job</h1>

      <form onSubmit={onSubmit} className="mt-4 rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Job Title:</label>
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Enter Job Title"
              value={form.job_title}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Type of Employment:</label>
            <select
              className="rounded-md border px-3 py-2"
              value={form.type_of_employment}
              onChange={(e) => setForm({ ...form, type_of_employment: e.target.value })}
              required
            >
              <option value="">Select Employment Type:</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Department:</label>
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Enter Department Name"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Location:</label>
            <select
              className="rounded-md border px-3 py-2"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            >
              <option value="">Select Job Location:</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex flex-col">
            <label className="mb-1 text-sm font-medium">Job Link:</label>
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Enter Job Link"
              value={form.job_link}
              onChange={(e) => setForm({ ...form, job_link: e.target.value })}
            />
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
