"use client";

import { useState } from "react";
import { notify } from "@/components/ui/notify";

export default function AddTestimonialPage() {
  const [patientName, setPatientName] = useState("");
  const [details, setDetails] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim()) return notify.error("Please enter Patient Name.");
    if (!details.trim()) return notify.error("Please enter testimonial details.");

    try {
      setSaving(true);
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: patientName.trim(),
          details: details.trim(),
          video_link: videoLink.trim(),
          status: "active",
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      notify.success("Testimonial added.");
      setPatientName("");
      setDetails("");
      setVideoLink("");
    } catch (e: any) {
      notify.error(e?.message || "Failed to add testimonial.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add New Testimonials</h1>

      <form onSubmit={submit} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Patient Name</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Enter the Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Patient Testimonials Details</label>
            <textarea
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Enter details…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Video Link</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Enter the Video Link"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
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
