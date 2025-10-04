"use client";

import React, { useState } from "react";
import { notify } from "@/components/ui/notify";

export default function AddClinicalStudyPage() {
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [details, setDetails] = useState("");

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!heading.trim()) return notify.error("Heading is required.");

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("heading_name", heading.trim());
      fd.append("description", description.trim());
      fd.append("link", link.trim());
      fd.append("details", details.trim());
      if (image) fd.append("image", image); // optional

      const r = await fetch("/api/clinical-study", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      notify.success("Clinical study added.");
      setHeading(""); setDescription(""); setLink(""); setDetails("");
      setImage(null); setPreview(null);
    } catch (err: any) {
      notify.error(err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add Clinical Study</h1>

      <form onSubmit={submit} className="rounded-xl border bg-white p-5 shadow-sm max-w-4xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Heading Name</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Enter heading…"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Link</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Details</label>
            <textarea
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

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
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#c8e967] px-4 py-2 text-sm font-medium text-black hover:bg-[#b9db58] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
