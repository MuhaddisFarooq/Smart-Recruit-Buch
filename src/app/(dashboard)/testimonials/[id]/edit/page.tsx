"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";

type Testimonial = {
  id: number;
  patient_name: string;
  details: string;
  video_link: string;
  status: "active" | "inactive";
};

export default function EditTestimonialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const num = Number(id);

  const [data, setData] = useState<Testimonial | null>(null);
  const [patientName, setPatientName] = useState("");
  const [details, setDetails] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/testimonials/${num}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setData(j.data);
        setPatientName(j.data.patient_name || "");
        setDetails(j.data.details || "");
        setVideoLink(j.data.video_link || "");
        setStatus(j.data.status || "active");
      } catch (e: any) {
        notify.error(e?.message || "Failed to load.");
        router.push("/testimonials/view");
      } finally {
        setLoading(false);
      }
    })();
  }, [num, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim()) return notify.error("Please enter Patient Name.");
    if (!details.trim()) return notify.error("Please enter testimonial details.");

    try {
      setSaving(true);
      const res = await fetch(`/api/testimonials/${num}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          details: details.trim(),
          video_link: videoLink.trim(),
          status,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      notify.success("Testimonial updated.");
      router.push("/testimonials/view");
    } catch (e: any) {
      notify.error(e?.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Edit Testimonial</h1>

      <form onSubmit={submit} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Patient Name</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Patient Testimonials Details</label>
            <textarea
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Video Link</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
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
