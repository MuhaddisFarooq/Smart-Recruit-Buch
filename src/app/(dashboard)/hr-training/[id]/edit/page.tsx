// src/app/(dashboard)/hr-training/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { notify } from "@/components/ui/notify";
import CKEditor4 from "@/components/CKEditor4";

type Training = {
  id: number;
  title: string | null;
  date: string | null;
  time: string | null;
  duration: string | null;
  trainer: string | null;
  participants: string | null;
  t_agenda: string | null; // HTML
  image: string | null;
  department: string | null;
  t_type: string | null;
  t_certificate: string | null;
};

function url(s?: string | null) {
  if (!s) return "";
  return s.startsWith("/") ? s : `/uploads/${s}`;
}

export default function EditHrTrainingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [data, setData] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // local form
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [trainer, setTrainer] = useState<string>("");
  const [participants, setParticipants] = useState<string>("");
  const [agenda, setAgenda] = useState<string>(""); // HTML (CKEditor)
  const [department, setDepartment] = useState<string>("");
  const [type, setType] = useState<string>("Face-to-face");
  const [certificate, setCertificate] = useState<string>("No");

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    console.log("Edit page effect. params.id:", params.id, "parsed id:", id);
    if (!id || isNaN(id)) return;
    (async () => {
      try {
        const r = await fetch(`/api/hr-training/${id}`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setData(j.data);

        setTitle(j.data.title || "");
        setDate(j.data.date ? new Date(j.data.date).toISOString().slice(0, 10) : "");
        setTime(j.data.time || "");
        setDuration(j.data.duration || "");
        setTrainer(j.data.trainer || "");
        setParticipants(j.data.participants || "");
        setAgenda(j.data.t_agenda ?? ""); // keep HTML
        setDepartment(j.data.department || "");
        setType(j.data.t_type || "Face-to-face");
        setCertificate(j.data.t_certificate || "No");
        setPreview(j.data.image ? url(j.data.image) : null);
      } catch (e: any) {
        notify.error(e?.message || "Failed to load.");
        router.push("/hr-training/view");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : (data?.image ? url(data.image) : null));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return notify.error("Title is required.");

    try {
      setSaving(true);
      let res: Response;

      if (image) {
        const fd = new FormData();
        fd.append("title", title);
        fd.append("date", date);
        fd.append("time", time);
        fd.append("duration", duration);
        fd.append("trainer", trainer);
        fd.append("participants", participants);
        fd.append("t_agenda", agenda); // HTML unchanged
        fd.append("department", department);
        fd.append("t_type", type);
        fd.append("t_certificate", certificate);
        fd.append("image", image);
        res = await fetch(`/api/hr-training/${id}`, { method: "PATCH", body: fd });
      } else {
        res = await fetch(`/api/hr-training/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            date,
            time,
            duration,
            trainer,
            participants,
            t_agenda: agenda, // HTML unchanged
            department,
            t_type: type,
            t_certificate: certificate,
          }),
        });
      }

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`); // ← fixed here
      notify.success("Training updated.");
      router.push("/hr-training/view");
    } catch (e: any) {
      notify.error(e?.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Edit HR Training</h1>

      <form onSubmit={submit} className="rounded-xl border bg-white p-5 shadow-sm max-w-4xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Title *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Time</label>
            <input
              type="time"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Duration</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Trainer(s)</label>
            <textarea
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={trainer}
              onChange={(e) => setTrainer(e.target.value)}
              placeholder="Separate by comma or newline"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Participants</label>
            <textarea
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="Separate by comma or newline"
            />
          </div>
        </div>

        {/* Training Agenda (CKEditor 4) */}
        <div className="mt-6">
          <label className="mb-1 block text-sm font-medium">Training Agenda</label>
          <CKEditor4
            value={agenda}
            onChange={setAgenda}
            height={400}
          // config={{ extraPlugins: "editorplaceholder", editorplaceholder: "Start writing your training agenda here..." }}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Department</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Training Type</label>
            <select
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>Face-to-face</option>
              <option>Online</option>
              <option>Hybrid</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Training Certificate</label>
            <select
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              value={certificate}
              onChange={(e) => setCertificate(e.target.value)}
            >
              <option>No</option>
              <option>Yes</option>
            </select>
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
