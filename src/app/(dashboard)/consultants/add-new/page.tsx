"use client";

import React, { useEffect, useRef, useState } from "react";
import { notify } from "@/components/ui/notify";
import RequirePerm from "@/components/auth/RequirePerm";
import { convertTo12Hour } from "@/lib/timeHelpers";

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
  experience: string;
  schedulePhysical: Record<DayKey, DaySchedule>;

  employment:
  | "Permanent"
  | "Visiting"
  | "International Visiting Doctor"
  | "Associate Consultant";
  isSurgeon: boolean;
  consultantTypes: {
    Physical: boolean;
    Telemedicine: boolean;
  };
  isFeatured: boolean;
  photoFile?: File | null;
  backgroundImageFile?: File | null;
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
  maxW = 9999,  // No resizing for high quality
  maxH = 9999,  // No resizing for high quality
  quality = 0.98 // High quality 98%
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

  // Set transparent background for PNG images
  const isPNG = file.type === "image/png";
  if (isPNG) {
    // Keep transparency for PNG
    ctx.clearRect(0, 0, width, height);
  } else {
    // Set white background for non-PNG images
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Use PNG format for PNG files to preserve transparency, JPEG for others
  const outputFormat = isPNG ? "image/png" : "image/jpeg";
  const outputQuality = isPNG ? 1.0 : quality; // PNG doesn't use quality parameter

  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b as Blob), outputFormat, outputQuality)
  );
  return blob;
}

// Upload a blob to /api/uploads and return the server filename + url
async function uploadBlob(blob: Blob, originalName = "image.jpg") {
  const fd = new FormData();

  // Determine file extension and type based on blob type
  const isPNG = blob.type === "image/png";
  const extension = isPNG ? ".png" : ".jpg";
  const fileName = originalName.replace(/\.[^.]+$/, extension);

  const f = new File([blob], fileName, {
    type: blob.type,
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
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const backgroundFileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormState>({
    consultantId: "",
    name: "",
    consultancyFee: "",
    degreeCompletionDate: "",
    specialties: "",
    education: "",
    expertise: "",
    experience: "",
    schedulePhysical: {
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
    consultantTypes: {
      Physical: true,
      Telemedicine: false,
    },
    isFeatured: false,
    photoFile: null,
    backgroundImageFile: null,
  });

  const [mainCats, setMainCats] = useState<MainCat[]>([]);
  const [subCats, setSubCats] = useState<SubCat[]>([]);
  const [selectedMain, setSelectedMain] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [saving, setSaving] = useState(false);

  // new: upload state + stored filename from server
  const [uploading, setUploading] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadedBackgroundFilename, setUploadedBackgroundFilename] = useState<string>("");

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
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((s) => ({
          ...s,
          schedulePhysical: {
            ...s.schedulePhysical,
            [day]: { ...s.schedulePhysical[day], [field]: e.target.value },
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

  // Background Image upload handler
  const onBackgroundImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setForm((s) => ({ ...s, backgroundImageFile: null }));
      setBackgroundPreview(null);
      setUploadedBackgroundFilename("");
      return;
    }

    try {
      setUploadingBackground(true);
      const compressed = await compressImage(file, 1920, 1080, 0.85);
      setBackgroundPreview(URL.createObjectURL(compressed));
      const up = await uploadBlob(compressed, file.name);
      setUploadedBackgroundFilename(up.filename);
      setForm((s) => ({ ...s, backgroundImageFile: file }));
      notify.success("Background image uploaded.");
    } catch (err: any) {
      console.error(err);
      notify.error(err?.message || "Failed to process background image.");
      setUploadedBackgroundFilename("");
      setBackgroundPreview(null);
      setForm((s) => ({ ...s, backgroundImageFile: null }));
    } finally {
      setUploadingBackground(false);
    }
  };

  // Remove background image handler
  const onRemoveBackgroundImage = () => {
    setForm((s) => ({ ...s, backgroundImageFile: null }));
    setBackgroundPreview(null);
    setUploadedBackgroundFilename("");
    if (backgroundFileRef.current) {
      backgroundFileRef.current.value = "";
    }
  };

  // Build schedule JSON expected by API with physical/telephonic labels
  const buildScheduleJson = () => {
    const buildForType = (schedule: Record<DayKey, DaySchedule>) => {
      const out: Record<string, { start: string; end: string }[]> = {};
      for (const { key } of dayLabels) {
        const d = schedule[key];
        const slots: { start: string; end: string }[] = [];
        if (d.morningStart || d.morningEnd) {
          slots.push({
            start: d.morningStart ? convertTo12Hour(d.morningStart) : "",
            end: d.morningEnd ? convertTo12Hour(d.morningEnd) : (d.morningStart ? convertTo12Hour(d.morningStart) : ""),
          });
        }
        if (d.eveningStart || d.eveningEnd) {
          slots.push({
            start: d.eveningStart ? convertTo12Hour(d.eveningStart) : "",
            end: d.eveningEnd ? convertTo12Hour(d.eveningEnd) : (d.eveningStart ? convertTo12Hour(d.eveningStart) : ""),
          });
        }
        out[key] = slots;
      }
      return out;
    };

    return {
      physical: buildForType(form.schedulePhysical),
    };
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

    const scheduleData = buildScheduleJson();
    console.log("📅 Schedule being saved:", JSON.stringify(scheduleData, null, 2));

    // Build consultant_type string from checkboxes
    const selectedTypes: string[] = [];
    if (form.consultantTypes.Physical) selectedTypes.push("Physical");
    if (form.consultantTypes.Telemedicine) selectedTypes.push("Telemedicine");
    const consultantType = selectedTypes.length > 0 ? selectedTypes.join(", ") : "Physical";

    console.log("🔍 Consultant Types State:", form.consultantTypes);
    console.log("🔍 Selected Types Array:", selectedTypes);
    console.log("🔍 Final consultantType string:", consultantType);

    const payload = {
      consultant_id: form.consultantId.trim(),
      cat_name: selectedSub,
      name: form.name.trim(),
      fee: form.consultancyFee ? Number(form.consultancyFee) : null,
      dcd: form.degreeCompletionDate || null,
      specialties: form.specialties,
      education: form.education,
      aoe: form.expertise,
      experience: form.experience,
      schedule: scheduleData,
      profile_pic: uploadedFilename || "",
      background_image: uploadedBackgroundFilename || "",
      employment_status: form.employment,
      doctor_type: form.isSurgeon ? "Surgeon" : "",
      consultant_type: consultantType,
      is_featured: form.isFeatured,
    };

    console.log("📦 Full payload being sent:", JSON.stringify(payload, null, 2));

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

      window.location.reload();
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
                value={form.consultantId || ""}
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
                value={form.name || ""}
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
                placeholder="Enter Fee"
                value={form.consultancyFee || ""}
                onChange={onText("consultancyFee")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Degree Completion Date</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2"
                value={form.degreeCompletionDate || ""}
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
                value={form.specialties || ""}
                onChange={onText("specialties")}
                placeholder="e.g. Cardiology, Interventional Cardiology"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Education</label>
              <textarea
                rows={4}
                className="w-full rounded-md border px-3 py-2"
                value={form.education || ""}
                onChange={onText("education")}
                placeholder="One per line or comma separated"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Areas of Expertise</label>
              <textarea
                rows={4}
                className="w-full rounded-md border px-3 py-2"
                value={form.expertise || ""}
                onChange={onText("expertise")}
                placeholder="One per line or comma separated"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Experience</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-md border px-3 py-2"
                value={form.experience || ""}
                onChange={onText("experience")}
                placeholder="Years of experience"
              />
            </div>
          </div>
        </section>

        {/* Physical Consultation Timings */}
        <section className="rounded-xl border bg-white/50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Physical Consultation Timings</h2>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <div className="hidden md:grid md:grid-cols-5 text-sm font-medium text-muted-foreground">
              <div />
              <div className="text-center">Morning Start</div>
              <div className="text-center">Morning End</div>
              <div className="text-center">Evening Start</div>
              <div className="text-center">Evening End</div>
            </div>

            {dayLabels.map(({ key, label }) => (
              <div key={key} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                <div className="font-medium">{label}</div>

                <input
                  type="time"
                  step="60"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={form.schedulePhysical[key].morningStart || ""}
                  onChange={onSchedule(key, "morningStart")}
                />

                <input
                  type="time"
                  step="60"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={form.schedulePhysical[key].morningEnd || ""}
                  onChange={onSchedule(key, "morningEnd")}
                />

                <input
                  type="time"
                  step="60"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={form.schedulePhysical[key].eveningStart || ""}
                  onChange={onSchedule(key, "eveningStart")}
                />

                <input
                  type="time"
                  step="60"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={form.schedulePhysical[key].eveningEnd || ""}
                  onChange={onSchedule(key, "eveningEnd")}
                />
              </div>
            ))}
          </div>
        </section>



        {/* Upload & Employment */}
        <section className="rounded-xl border bg-white/50 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Picture Upload */}
            <div>
              <h3 className="text-sm font-medium mb-2">Upload Profile Picture</h3>
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

            {/* Background Image Upload */}
            <div>
              <h3 className="text-sm font-medium mb-2">Upload Background Image</h3>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-24 overflow-hidden rounded-md border bg-gray-50 flex items-center justify-center">
                  {backgroundPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={backgroundPreview} alt="background preview" className="h-16 w-24 object-cover" />
                      <button
                        type="button"
                        onClick={onRemoveBackgroundImage}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-xs font-bold shadow-md"
                        title="Remove background image"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-gray-400">No image</span>
                  )}
                </div>
                <input
                  ref={backgroundFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onBackgroundImage}
                />
                <button
                  type="button"
                  onClick={() => backgroundFileRef.current?.click()}
                  className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-black/80"
                >
                  Choose Background
                </button>
                {uploadingBackground && <span className="text-xs text-gray-500">Uploading…</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Consultant Type - Hidden/Removed as we only support Physical now */}
            {/* 
            <div>
              <label className="text-sm font-medium">Consultant Type</label>
              <div className="mt-1 flex flex-col gap-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.consultantTypes.Physical}
                    disabled
                    readOnly
                  />
                  <span>Physical</span>
                </label>
              </div>
            </div>
            */}

            {/* Employment */}
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

            {/* Doctor Type */}
            <div>
              <h3 className="text-sm font-medium mb-2">Doctor Type</h3>
              <div className="flex flex-col gap-3">
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
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, isFeatured: e.target.checked }))
                    }
                  />
                  <span>Featured on Home Slider</span>
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
    </div >
  );
}

export default function AddConsultantPage() {
  return (
    <RequirePerm moduleKey="consultants" action="new">
      <AddConsultantInner />
    </RequirePerm>
  );
}
