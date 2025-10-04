"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";

type Row = {
  id: number;
  heading_name: string;
  description: string;
  link: string | null;
  details: string | null;
  picture: string | null;
  status: "active" | "inactive";
};

export default function EditPublicationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<Row | null>(null);
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [details, setDetails] = useState("");

  const [picture, setPicture] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  function toUrl(s?: string | null) {
    if (!s) return null;
    return s.startsWith("/") ? s : `/uploads/${s}`;
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/publications/${id}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setData(j.data);
        setHeading(j.data.heading_name || "");
        setDescription(j.data.description || "");
        setLink(j.data.link || "");
        setDetails(j.data.details || "");
        setPreview(toUrl(j.data.picture));
      } catch (e: any) {
        notify.error(e?.message || "Failed to load.");
        router.push("/publications/view");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setPicture(f);
    setPreview(f ? URL.createObjectURL(f) : toUrl(data?.picture));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!heading.trim()) return notify.error("Heading is required.");
    try {
      setSaving(true);
      let res: Response;

      if (picture) {
        const fd = new FormData();
        fd.append("heading_name", heading.trim());
        fd.append("description", description.trim());
        fd.append("link", link.trim());
        fd.append("details", details.trim());
        fd.append("picture", picture);
        res = await fetch(`/api/publications/${id}`, { method: "PATCH", body: fd });
      } else {
        res = await fetch(`/api/publications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            heading_name: heading.trim(),
            description: description.trim(),
            link: link.trim(),
            details: details.trim(),
          }),
        });
      }

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      notify.success("Publication updated.");
      router.push("/publications/view");
    } catch (e: any) {
      notify.error(e?.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Edit Publication</h1>

      <form onSubmit={submit} className="rounded-xl border bg-white p-5 shadow-sm max-w-4xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Heading</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
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
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Details</label>
            <textarea
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Picture</label>
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
