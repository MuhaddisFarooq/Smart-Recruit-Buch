// src/app/(dashboard)/achievements/add/page.tsx
"use client";

import { useState } from "react";
import { notify } from "@/components/ui/notify";

export default function AddAchievementPage() {
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      notify.error("Please choose an image.");
      return;
    }

    try {
      setSaving(true);
      const task = (async () => {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch("/api/achievements", { method: "POST", body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Uploading…",
        success: "Achievement added.",
        error: (e) => (e as Error)?.message || "Upload failed.",
      });

      setFile(null);
      setPreview(null);
      (document.getElementById("file") as HTMLInputElement | null)?.value && ((document.getElementById("file") as HTMLInputElement).value = "");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Add Achievement</h1>
      <p className="mb-6 text-sm text-gray-500">Upload an image. It will be compressed for fast loading.</p>

      <form onSubmit={onSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Image</label>
            <input id="file" type="file" accept="image/*" onChange={onPick}
              className="w-full rounded-md border px-3 py-2" />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="mt-3 h-40 rounded-md object-cover" />
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !file}
            className="h-10 rounded-md bg-[#c8e967] px-4 font-medium text-black hover:bg-[#b9db58] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
