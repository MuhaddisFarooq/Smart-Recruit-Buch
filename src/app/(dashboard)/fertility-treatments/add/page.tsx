// src/app/(dashboard)/fertility-treatments/add/page.tsx
"use client";

import { useState } from "react";
import { notify } from "@/components/ui/notify";
import CKEditor4 from "@/components/CKEditor4";

export default function AddFertilityTreatmentPage() {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState(""); // CKEditor HTML
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
    if (!title.trim()) return notify.error("Title is required.");

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("title", title);
      fd.append("details", details);
      fd.append("description_html", descriptionHtml); // keep HTML verbatim
      if (image) fd.append("image", image);

      const res = await fetch("/api/fertility-treatments", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      notify.success("Fertility treatment saved.");
      setTitle("");
      setDetails("");
      setDescriptionHtml("");
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
      <h1 className="mb-4 text-2xl font-semibold">Add Fertility Treatment</h1>

      <form onSubmit={submit} className="rounded-xl border bg-white p-5 shadow-sm max-w-4xl space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ICSI"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Details (short blurb)</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Short text shown on the card…"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Image</label>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-32 items-center justify-center overflow-hidden rounded-md border bg-gray-50">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="h-24 w-32 object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">No image</span>
                )}
              </div>
              <input type="file" accept="image/*" onChange={onPick} />
            </div>
          </div>
        </div>

        {/* CKEditor 4 for Description */}
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <CKEditor4
            value={descriptionHtml}
            onChange={setDescriptionHtml}
            height={400}
            // config={{ extraPlugins: "editorplaceholder", editorplaceholder: "Write the full treatment description…" }}
          />
          <p className="mt-1 text-xs text-gray-500">
            This rich text will be stored and rendered exactly as written.
          </p>
        </div>

        <div className="pt-2">
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
