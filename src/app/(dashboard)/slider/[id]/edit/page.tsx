"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { notify } from "@/components/ui/notify";

type Slider = {
  id: number;
  image: string;
  start_date: string;
  end_date: string;
  status: "active" | "inactive";
};

export default function EditSliderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [data, setData] = useState<Slider | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/sliders/${id}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setData(j.data);
        setStartDate(new Date(j.data.start_date).toISOString().slice(0,16));
        setEndDate(new Date(j.data.end_date).toISOString().slice(0,16));
        setStatus(j.data.status);
        setPreview(j.data.image ? (j.data.image.startsWith("/") ? j.data.image : `/uploads/${j.data.image}`) : null);
      } catch (e: any) {
        notify.error(e?.message || "Failed to load.");
        router.push("/slider/view");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : (data?.image ? `/uploads/${data.image}` : null));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (!(sd instanceof Date) || !(ed instanceof Date) || ed < sd) {
      return notify.error("Please provide a valid date range.");
    }

    try {
      setSaving(true);
      let res: Response;

      if (image) {
        const fd = new FormData();
        fd.append("start_date", sd.toISOString());
        fd.append("end_date", ed.toISOString());
        fd.append("status", status);
        fd.append("image", image);
        res = await fetch(`/api/sliders/${id}`, { method: "PATCH", body: fd });
      } else {
        res = await fetch(`/api/sliders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start_date: sd.toISOString(), end_date: ed.toISOString(), status }),
        });
      }

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      notify.success("Slider updated.");
      router.push("/slider/view");
    } catch (e: any) {
      notify.error(e?.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Edit Slider</h1>

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
