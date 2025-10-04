"use client";

import { useState } from "react";
import { notify } from "@/components/ui/notify";

export default function AddHrTrainingPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // form fields
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
      if (image) fd.append("image", image);
      fd.append("title", title);
      if (date) fd.append("date", date);
      if (time) fd.append("time", time);
      if (duration) fd.append("duration", duration);
      if (trainer) fd.append("trainer", trainer);
      if (participants) fd.append("participants", participants);
      // Keep CKEditor HTML intact:
      if (agenda !== undefined) fd.append("t_agenda", agenda);
      if (department) fd.append("department", department);
      if (type) fd.append("t_type", type);
      if (certificate) fd.append("t_certificate", certificate);

      const r = await fetch("/api/hr-training", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

      notify.success("HR training saved.");
      // reset
      setImage(null);
      setPreview(null);
      setTitle("");
      setDate("");
      setTime("");
      setDuration("");
      setTrainer("");
      setParticipants("");
      setAgenda("");
      setDepartment("");
      setType("Face-to-face");
      setCertificate("No");
    } catch (e: any) {
      notify.error(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add HR Training</h1>

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
              placeholder="e.g. 2 Hrs"
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

          {/* Training Agenda (HTML) */}
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Training Agenda (HTML / CKEditor content)
            </label>
            <textarea
              rows={12}
              className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="<h3>Welcome</h3><p>Intro text…</p>"
            />
            <p className="mt-1 text-xs text-gray-500">
              Paste the HTML from CKEditor here; it will be stored and rendered as-is.
            </p>
          </div>

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

        <div className="mt-4">
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
