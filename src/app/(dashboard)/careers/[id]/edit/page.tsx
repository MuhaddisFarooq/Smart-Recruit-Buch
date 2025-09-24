"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";

type Form = {
  job_title: string;
  type_of_employment: string;
  department: string;
  location: string;
  job_link: string;
  status?: "active" | "inactive";
};

// keep these in sync with your Add page
const EMPLOYMENT_TYPES = [
  "Full-Time",
  "Part-Time",
  "Contract",
  "Internship",
  "Temporary",
  "Per Diem",
];

const LOCATIONS = [
  "Multan, Pakistan",
  "Lahore, Pakistan",
  "Karachi, Pakistan",
  "Islamabad, Pakistan",
  "Remote",
];

export default function EditCareerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form | null>(null);

  const employmentOptions = useMemo(() => {
    if (!form?.type_of_employment) return EMPLOYMENT_TYPES;
    return EMPLOYMENT_TYPES.includes(form.type_of_employment)
      ? EMPLOYMENT_TYPES
      : [form.type_of_employment, ...EMPLOYMENT_TYPES];
  }, [form?.type_of_employment]);

  const locationOptions = useMemo(() => {
    if (!form?.location) return LOCATIONS;
    return LOCATIONS.includes(form.location)
      ? LOCATIONS
      : [form.location, ...LOCATIONS];
  }, [form?.location]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/careers/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error("not found");
        const j = await r.json();
        const d = j?.data;

        setForm({
          job_title: d?.job_title ?? "",
          type_of_employment: d?.type_of_employment ?? "",
          department: d?.department ?? "",
          location: d?.location ?? "",
          job_link: d?.job_link ?? "",
          status: d?.status === "inactive" ? "inactive" : "active",
        });
      } catch {
        setForm(null);
        notify.error("Job not found.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    if (
      !form.job_title.trim() ||
      !form.type_of_employment.trim() ||
      !form.department.trim() ||
      !form.location.trim()
    ) {
      notify.error(
        "Please fill Job Title, Employment Type, Department, and Location."
      );
      return;
    }

    setSaving(true);
    try {
      const task = (async () => {
        const r = await fetch(`/api/careers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || `Failed (${r.status})`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Saving changes…",
        success: "Job updated.",
        error: (e) => (e as Error)?.message || "Update failed.",
      });

      router.push("/careers");
    } catch {
      // toast already shown
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!form) return <div className="p-6">Not found.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Edit Job</h1>

      <form onSubmit={onSubmit} className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Job Title:</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="Enter Job Title"
              value={form.job_title}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Type of Employment:</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.type_of_employment}
              onChange={(e) =>
                setForm({ ...form, type_of_employment: e.target.value })
              }
            >
              <option value="">Select Employment Type:</option>
              {employmentOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Department:</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="Enter Department Name"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Location:</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              <option value="">Select Job Location:</option>
              {locationOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Job Link:</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="Enter Job Link"
              value={form.job_link}
              onChange={(e) => setForm({ ...form, job_link: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6">
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
