// src/app/(dashboard)/popup/add/page.tsx
"use client";

import { useState } from "react";
import { notify } from "@/components/ui/notify";

export default function AddPopupPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0,16)); // datetime-local
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0,16);
  });
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) return notify.error("Please choose an image.");

    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (!(sd instanceof Date) || !(ed instanceof Date) || ed < sd) {
      return notify.error("Please provide a valid date range.");
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("image", image);
      fd.append("start_date", new Date(startDate).toISOString());
      fd.append("end_date", new Date(endDate).toISOString());
      fd.append("status", status);

      const r = await fetch("/api/popups", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      notify.success("PopUp saved.");
      // reset
      setImage(null);
      setPreview(null);
    } catch (e: any) {
      notify.error(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add PopUp</h1>

      <form onSubmit={submit} className="rounded-xl border bg-white p-5 shadow-sm max-w-3xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Image</label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-md border bg-gray-50">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="h-20 w-28 object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">No image</span>
                )}
              </div>
              <input type="file" accept="image/*" onChange={onPick} />
            </div>
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

          <div>
            <label className="mb-1 block text-sm font-medium">Start Date &amp; Time</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">End Date &amp; Time</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
