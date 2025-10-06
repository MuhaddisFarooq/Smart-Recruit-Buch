"use client";

import React, { useEffect, useRef, useState } from "react";
import { notify } from "@/components/ui/notify";
import RequirePerm from "@/components/auth/RequirePerm";

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DaySchedule = {
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
};

type FormState = {
  consultantId: string;
  name: string;
  consultancyFee: string;
  degreeCompletionDate: string;
  specialties: string;
  education: string;
  expertise: string;
  schedule: Record<DayKey, DaySchedule>;
  employment:
    | "Permanent"
    | "Visiting"
    | "International Visiting Doctor"
    | "Associate Consultant";
  isSurgeon: boolean;
  photoFile?: File | null;
};

type MainCat = { id: number; cat_name: string };
type SubCat = { id: number; cat_name: string; main_cat_name: string };

const defaultDay: DaySchedule = {
  morningStart: "",
  morningEnd: "",
  eveningStart: "",
  eveningEnd: "",
};

const dayLabels: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

/* -------------------- image helpers (compression + upload) -------------------- */

// Compress an image to max WxH and quality; returns a Blob
async function compressImage(
  file: File,
  maxW = 600,
  maxH = 600,
  quality = 0.72
): Promise<Blob> {
  const img = document.createElement("img");
  const reader = new FileReader();

  const dataURL: string = await new Promise((res, rej) => {
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = dataURL;
  });

  let { width, height } = img;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), "image/jpeg", quality)
  );
  return blob;
}

// Upload a blob to /api/uploads and return the server filename + url
async function uploadBlob(blob: Blob, originalName = "image.jpg") {
  const fd = new FormData();
  const f = new File([blob], originalName.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
  fd.append("file", f);

  const r = await fetch("/api/uploads", { method: "POST", body: fd });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j?.error || `Upload failed (HTTP ${r.status})`);
  }
  return (await r.json()) as { ok: true; filename: string; url: string };
}

/* ----------------------------------------------------------------------------- */

function AddConsultantInner() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormState>({
    consultantId: "",
    name: "",
    consultancyFee: "",
    degreeCompletionDate: "",
    specialties: "",
    education: "",
    expertise: "",
    schedule: {
      monday: { ...defaultDay },
      tuesday: { ...defaultDay },
      wednesday: { ...defaultDay },
      thursday: { ...defaultDay },
      friday: { ...defaultDay },
      saturday: { ...defaultDay },
      sunday: { ...defaultDay },
    },
    employment: "Permanent",
    isSurgeon: false,
    photoFile: null,
  });

  const [mainCats, setMainCats] = useState<MainCat[]>([]);
  const [subCats, setSubCats] = useState<SubCat[]>([]);
  const [selectedMain, setSelectedMain] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [saving, setSaving] = useState(false);

  // new: upload state + stored filename from server
  const [uploading, setUploading] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");

  // Fetch main categories
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/consultants/main-categories", {
          cache: "no-store",
        });
        const j = await r.json();
        setMainCats(Array.isArray(j?.data) ? j.data : []);
      } catch {
        setMainCats([]);
        notify.error("Failed to load main categories.");
      }
    })();
  }, []);

  // Fetch subcategories when main changes
  useEffect(() => {
    if (!selectedMain) {
      setSubCats([]);
      setSelectedSub("");
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `/api/consultants/categories?main=${encodeURIComponent(selectedMain)}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        setSubCats(Array.isArray(j?.data) ? j.data : []);
      } catch {
        setSubCats([]);
        notify.error("Failed to load consultant categories.");
      }
    })();
  }, [selectedMain]);

  // Generic text setter
  const onText =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((s) => ({ ...s, [key]: e.target.value }));
    };

  // Day schedule setter
  const onSchedule =
    (day: DayKey, field: keyof DaySchedule) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((s) => ({
        ...s,
        schedule: {
          ...s.schedule,
          [day]: { ...s.schedule[day], [field]: e.target.value },
        },
      }));
    };

  // Image (compress + upload, then set preview + filename)
  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setForm((s) => ({ ...s, photoFile: null }));
      setPreview(null);
      setUploadedFilename("");
      return;
    }

    try {
      setUploading(true);
      const compressed = await compressImage(file, 600, 600, 0.72);
      setPreview(URL.createObjectURL(compressed));
      const up = await uploadBlob(compressed, file.name);
      setUploadedFilename(up.filename);
      setForm((s) => ({ ...s, photoFile: file }));
      notify.success("Photo uploaded.");
    } catch (err: any) {
      console.error(err);
      notify.error(err?.message || "Failed to process image.");
      setUploadedFilename("");
      setPreview(null);
      setForm((s) => ({ ...s, photoFile: null }));
    } finally {
      setUploading(false);
    }
  };

  // Build schedule JSON expected by API
  const buildScheduleJson = () => {
    const out: Record<string, { start: string; end: string }[]> = {};
    for (const { key } of dayLabels) {
      const d = form.schedule[key];
      const slots: { start: string; end: string }[] = [];
      if (d.morningStart || d.morningEnd) {
        slots.push({
          start: d.morningStart || "",
          end: d.morningEnd || d.morningStart || "",
        });
      }
      if (d.eveningStart || d.eveningEnd) {
        slots.push({
          start: d.eveningStart || "",
          end: d.eveningEnd || d.eveningStart || "",
        });
      }
      out[key] = slots;
    }
    return out;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consultantId.trim() || !form.name.trim()) {
      notify.error("Consultant ID and Name are required.");
      return;
    }
    if (!selectedSub) {
      notify.error("Please select a Consultant Category.");
      return;
    }

    const payload = {
      consultant_id: form.consultantId.trim(),
      cat_name: selectedSub,
      name: form.name.trim(),
      fee: form.consultancyFee ? Number(form.consultancyFee) : null,
      dcd: form.degreeCompletionDate || null,
      specialties: form.specialties,
      education: form.education,
      aoe: form.expertise,
      schedule: buildScheduleJson(),
      profile_pic: uploadedFilename || "",
      employment_status: form.employment,
      doctor_type: form.isSurgeon ? "Surgeon" : "",
    };

    try {
      setSaving(true);
      await notify.promise(
        (async () => {
          const res = await fetch("/api/consultants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const j = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(j?.error || `Failed (HTTP ${res.status})`);
          return j;
        })(),
        {
          loading: "Saving consultant…",
          success: "Consultant saved.",
          error: (e) => e?.message || "Could not save consultant.",
        }
      );

      // Reset form on success
      setForm({
        consultantId: "",
        name: "",
        consultancyFee: "",
        degreeCompletionDate: "",
        specialties: "",
        education: "",
        expertise: "",
        schedule: {
          monday: { ...defaultDay },
          tuesday: { ...defaultDay },
          wednesday: { ...defaultDay },
          thursday: { ...defaultDay },
          friday: { ...defaultDay },
          saturday: { ...defaultDay },
          sunday: { ...defaultDay },
        },
        employment: "Permanent",
        isSurgeon: false,
        photoFile: null,
      });
      setPreview(null);
      setSelectedMain("");
      setSelectedSub("");
      setSubCats([]);
      setUploadedFilename("");
    } catch {
      /* toast already shown */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Add New Consultant</h1>
      <p className="text-muted-foreground mt-1">
        Fill the details below to create a consultant profile.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-8">
        {/* Basic Info */}
        <section className="rounded-xl border bg-white/50 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Consultant ID</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Consultant ID"
                value={form.consultantId}
                onChange={onText("consultantId")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Main Speciality Category</label>
              <select
                className="w-full rounded-md border px-3 py-2 bg-white"
                value={selectedMain}
                onChange={(e) => {
                  setSelectedMain(e.target.value);
                  setSelectedSub("");
                }}
              >
                <option value="">Select Main Speciality Category</option>
                {mainCats.map((m) => (
                  <option key={m.id} value={m.cat_name}>
                    {m.cat_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Consultant Category</label>
              <select
                className="w-full rounded-md border px-3 py-2 bg-white"
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
                disabled={!selectedMain}
              >
                <option value="">
                  {selectedMain
                    ? "Select Consultant Category"
                    : "Select main category first"}
                </option>
                {subCats.map((c) => (
                  <option key={c.id} value={c.cat_name}>
                    {c.cat_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Enter Consultant Name"
                value={form.name}
                onChange={onText("name")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Consultancy Fee</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border px-3 py-2"
                placeholder="Enter Consultancy Fee"
                value={form.consultancyFee}
                onChange={onText("consultancyFee")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Degree Completion Date</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2"
                value={form.degreeCompletionDate}
                onChange={onText("degreeCompletionDate")}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">
                Specialties <span className="text-gray-500">(comma or newline separated)</span>
              </label>
              <textarea
                rows={2}
                className="w-full rounded-md border px-3 py-2"
                value={form.specialties}
                onChange={onText("specialties")}
                placeholder="e.g. Cardiology, Interventional Cardiology"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Education</label>
              <textarea
                rows={4}
                className="w-full rounded-md border px-3 py-2"
                value={form.education}
                onChange={onText("education")}
                placeholder="One per line or comma separated"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Areas of Expertise</label>
              <textarea
                rows={4}
                className="w-full rounded-md border px-3 py-2"
                value={form.expertise}
                onChange={onText("expertise")}
                placeholder="One per line or comma separated"
              />
            </div>
          </div>
        </section>

        {/* Weekly Timings */}
        <section className="rounded-xl border bg-white/50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Please Enter Consultant Timings Below…</h2>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <div className="hidden md:grid md:grid-cols-5 text-sm font-medium text-muted-foreground">
              <div />
              <div className="text-center">Morning Start</div>
              <div className="text-center">Morning End</div>
              <div className="text-center">Evening Start</div>
              <div className="text-center">Evening End</div>
            </div>

            {dayLabels.map(({ key, label }) => (
              <div key={key} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <div className="font-medium">{label}</div>
                <input
                  type="time"
                  className="rounded-md border px-3 py-2"
                  value={form.schedule[key].morningStart}
                  onChange={onSchedule(key, "morningStart")}
                />
                <input
                  type="time"
                  className="rounded-md border px-3 py-2"
                  value={form.schedule[key].morningEnd}
                  onChange={onSchedule(key, "morningEnd")}
                />
                <input
                  type="time"
                  className="rounded-md border px-3 py-2"
                  value={form.schedule[key].eveningStart}
                  onChange={onSchedule(key, "eveningStart")}
                />
                <input
                  type="time"
                  className="rounded-md border px-3 py-2"
                  value={form.schedule[key].eveningEnd}
                  onChange={onSchedule(key, "eveningEnd")}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Upload & Employment */}
        <section className="rounded-xl border bg-white/50 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium mb-2">Upload Picture</h3>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-md border bg-gray-50 flex items-center justify-center">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="preview" className="h-16 w-16 object-cover" />
                  ) : (
                    <span className="text-[11px] text-gray-400">No image</span>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhoto}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-black/80"
                >
                  Choose Image
                </button>
                {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Employment</h3>
                <div className="flex flex-wrap items-center gap-4">
                  {(
                    [
                      "Permanent",
                      "Visiting",
                      "International Visiting Doctor",
                      "Associate Consultant",
                    ] as const
                  ).map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="employment"
                        checked={form.employment === opt}
                        onChange={() => setForm((s) => ({ ...s, employment: opt }))}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Doctor Type</h3>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isSurgeon}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, isSurgeon: e.target.checked }))
                    }
                  />
                  <span>Surgeon</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-md px-4 py-2 font-medium text-white shadow disabled:opacity-60"
            style={{ backgroundColor: "#c8e967", color: "#111" }}
          >
            {saving ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddConsultantPage() {
  return (
    <RequirePerm moduleKey="consultants" action="new">
      <AddConsultantInner />
    </RequirePerm>
  );
}
