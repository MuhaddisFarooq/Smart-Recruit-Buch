// src/app/(dashboard)/fertility-treatments/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";

function toUrl(s?: string | null) { if (!s) return null; return s.startsWith("/") ? s : `/uploads/${s}`; }

export default function EditFertilityTreatmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/fertility-treatments/${id}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setTitle(j.data.title || "");
        setDetails(j.data.details || "");
        setDescriptionHtml(j.data.description_html || "");
        setImagePath(j.data.image || null);
        setPreview(toUrl(j.data.image));
      } catch (e: any) {
        notify.error(e?.message || "Failed to load.");
        router.push("/fertility-treatments/view");
      } finally { setLoading(false); }
    })();
  }, [id, router]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : toUrl(imagePath));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      let res: Response;

      if (image) {
        const fd = new FormData();
        fd.append("title", title);
        fd.append("details", details);
        fd.append("description_html", descriptionHtml);
        fd.append("image", image);
        res = await fetch(`/api/fertility-treatments/${id}`, { method: "PATCH", body: fd });
      } else {
        res = await fetch(`/api/fertility-treatments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, details, description_html: descriptionHtml }),
        });
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      notify.success("Updated.");
      router.push("/fertility-treatments/view");
    } catch (e: any) {
      notify.error(e?.message || "Failed to update.");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Edit Fertility Treatment</h1>

      <form onSubmit={save} className="rounded-xl border bg-white p-5 shadow-sm max-w-4xl space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={title}
                   onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Details</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={details}
                   onChange={(e) => setDetails(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Image</label>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-32 items-center justify-center overflow-hidden rounded-md border bg-gray-50">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="preview" className="h-24 w-32 object-cover" />
                ) : <span className="text-xs text-gray-400">No image</span>}
              </div>
              <input type="file" accept="image/*" onChange={onPick} />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description (HTML)</label>
          <textarea rows={12}
                    className="w-full rounded-md border px-3 py-2 text-sm font-mono"
                    value={descriptionHtml}
                    onChange={(e) => setDescriptionHtml(e.target.value)} />
        </div>

        <div className="pt-2 flex items-center gap-2">
          <button type="button" onClick={() => history.back()} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
                  className="rounded-md bg-[#c8e967] px-4 py-2 text-sm font-medium text-black hover:bg-[#b9db58] disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
