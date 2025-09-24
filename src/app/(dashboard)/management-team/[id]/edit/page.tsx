"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";

type Row = {
  id: number;
  name: string;
  designation: string;
  photo: string | null;
  status: "active" | "inactive";
};

export default function EditTeamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Row | null>(null);

  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/management-team/${id}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setData(j.data);
        setName(j.data?.name || "");
        setDesignation(j.data?.designation || "");
      } catch (e: any) {
        notify.error(e?.message || "Failed to load team member.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !designation.trim()) {
      notify.error("Please fill Name and Designation.");
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("designation", designation.trim());
      if (file) fd.append("image", file);

      const res = await fetch(`/api/management-team/${id}`, {
        method: "PATCH",
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      notify.success("Team member updated.");
      router.push("/management-team/view");
    } catch (err: any) {
      notify.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!data) return <div className="p-6">Not found.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Edit Team Member</h1>

      <form onSubmit={onSubmit} className="mt-4 rounded-xl border bg-white p-5 shadow-sm max-w-2xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Designation</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-md border px-3 py-2"
            />
            {data.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.photo.startsWith("http") ? data.photo : `/uploads/${data.photo}`}
                alt={data.name}
                className="mt-3 h-24 w-24 rounded-md object-cover"
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2 hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-[#c8e967] px-4 py-2 font-medium text-black hover:bg-[#b9db58] disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
