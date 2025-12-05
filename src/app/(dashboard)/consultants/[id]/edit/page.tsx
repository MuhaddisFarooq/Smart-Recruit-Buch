"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";
import RequirePerm from "@/components/auth/RequirePerm";
import { parseTime, convertTo12Hour } from "@/lib/timeHelpers";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

type DaySchedule = {
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
};

type MainCat = { id: number; cat_name: string };
type SubCat = { id: number; cat_name: string; main_cat_name: string };

type Form = {
  consultant_id: string;
  name: string;
  cat_name: string;
  fee: string;
  dcd: string;
  specialties: string;
  education: string;
  aoe: string;
  experience: string;
  schedulePhysical: Record<DayKey, DaySchedule>;

  profile_pic: string;           // store "consultants/<file>" in DB
  background_image: string;      // store background image filename
  employment_status: string;
  doctor_type: string;
  consultant_types: {
    Physical: boolean;
    Telemedicine: boolean;
  };
  status: "active" | "inactive";
};

const days: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const defaultDay: DaySchedule = {
  morningStart: "",
  morningEnd: "",
  eveningStart: "",
  eveningEnd: "",
};

/** Same resolver as view */
function toPicUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  let s = String(src).trim().replace(/\\/g, "/").replace(/^public\//i, "");
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
  if (s.startsWith("uploads/")) return `/${s}`;
  if (s.startsWith("/uploads/")) return s;
  if (s.startsWith("consultants/")) return `/uploads/${s}`;
  if (s.includes("/")) return `/uploads/${s}`;
  return `/uploads/consultants/${s}`;
}

/** compression */
async function compressImage(file: File): Promise<Blob> {
  const img = document.createElement("img");
  const reader = new FileReader();
  const dataUrl: string = await new Promise((res, rej) => {
    reader.onload = () => res(String(reader.result));
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = dataUrl;
  });

  const maxSide = 9999; // No resizing for high quality
  let { width, height } = img;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  // Handle transparency for PNG files
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
  const outputQuality = isPNG ? 1.0 : 0.98; // High quality 98% for JPEG, PNG doesn't use quality parameter

  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b || file), outputFormat, outputQuality)
  );
  return blob!;
}

/** Upload; return "consultants/<fname>" for DB */
async function tryUpload(file: File): Promise<string> {
  try {
    const compressed = (await compressImage(file)) as Blob;
    const fd = new FormData();

    // Preserve file extension based on compressed blob type
    const isPNG = compressed.type === "image/png";
    const extension = isPNG ? ".png" : ".jpg";
    const baseName = file.name.replace(/\s+/g, "_").replace(/[^\w.\-]/g, "").replace(/\.[^.]+$/, "") || "photo";
    const outName = baseName + extension;

    // Create file with correct MIME type
    const uploadFile = new File([compressed], outName, { type: compressed.type });
    fd.append("file", uploadFile);

    const r = await fetch("/api/uploads", { method: "POST", body: fd });
    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      return String(j?.filename || j?.fileName || outName); // "consultants/<name>"
    }
    return outName;
  } catch {
    return file.name;
  }
}

function EditConsultantInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const backgroundFileRef = useRef<HTMLInputElement | null>(null);
  const prevObjectUrl = useRef<string | null>(null);
  const prevBackgroundObjectUrl = useRef<string | null>(null);

  // Category selection state
  const [mainCats, setMainCats] = useState<MainCat[]>([]);
  const [subCats, setSubCats] = useState<SubCat[]>([]);
  const [selectedMain, setSelectedMain] = useState("");
  const [selectedSub, setSelectedSub] = useState("");

  // Load main categories on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/consultants/main-categories", { cache: "no-store" });
        const j = await r.json();
        setMainCats(Array.isArray(j?.data) ? j.data : []);
      } catch {
        setMainCats([]);
      }
    })();
  }, []);

  // Load subcategories when main category changes
  useEffect(() => {
    if (!selectedMain) {
      setSubCats([]);
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
      }
    })();
  }, [selectedMain]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/consultants/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error("not found");
        const j = await r.json();
        const d = j?.data;

        const parseScheduleForType = (scheduleData: any) => {
          const out: Record<DayKey, DaySchedule> = {} as any;
          for (const k of days) {
            const daySlots = Array.isArray(scheduleData?.[k]) ? scheduleData[k] : [];
            const morning = daySlots[0] || {};
            const evening = daySlots[1] || {};

            const morningStartParsed = parseTime(morning.start || "");
            const morningEndParsed = parseTime(morning.end || "");
            const eveningStartParsed = parseTime(evening.start || "");
            const eveningEndParsed = parseTime(evening.end || "");

            out[k] = {
              morningStart: morningStartParsed?.time || "",
              morningEnd: morningEndParsed?.time || "",
              eveningStart: eveningStartParsed?.time || "",
              eveningEnd: eveningEndParsed?.time || "",
            };
          }
          return out;
        };

        let schedulePhysical: Record<DayKey, DaySchedule>;

        try {
          const scheduleRaw = JSON.parse(d?.schedule || "{}");

          // Check if new format (with physical/telephonic labels)
          if (scheduleRaw.physical || scheduleRaw.telephonic) {
            schedulePhysical = parseScheduleForType(scheduleRaw.physical || {});
          } else {
            // Old format - use same schedule for both
            schedulePhysical = parseScheduleForType(scheduleRaw);
          }
        } catch {
          schedulePhysical = days.reduce((acc, k) => ({ ...acc, [k]: { ...defaultDay } }), {} as Record<DayKey, DaySchedule>);
        }

        // Parse consultant_type from database (could be "Physical", "Telemedicine", or "Physical, Telemedicine")
        const consultantTypesFromDb = d?.consultant_type || "Physical";
        const typesArray = consultantTypesFromDb.split(",").map((t: string) => t.trim());

        setForm({
          consultant_id: d?.consultant_id || "",
          name: d?.name || "",
          cat_name: d?.cat_name || "",
          fee: d?.fee ?? "",
          dcd: d?.dcd ?? "",
          specialties: d?.specialties ?? "",
          education: d?.education ?? "",
          aoe: d?.aoe ?? "",
          experience: d?.experience ?? "",
          schedulePhysical,

          profile_pic: d?.profile_pic ?? "",
          background_image: d?.background_image ?? "",
          employment_status: d?.employment_status ?? "",
          doctor_type: d?.doctor_type ?? "",
          consultant_types: {
            Physical: typesArray.includes("Physical"),
            Telemedicine: typesArray.includes("Telemedicine") || typesArray.includes("Telephonic"),
          },
          status: d?.status === "inactive" ? "inactive" : "active",
        });

        // Set the selected subcategory
        setSelectedSub(d?.cat_name || "");

        // Fetch the main category for this subcategory
        if (d?.cat_name) {
          try {
            const catRes = await fetch("/api/consultants/categories", { cache: "no-store" });
            const catJson = await catRes.json();
            const allSubCats = Array.isArray(catJson?.data) ? catJson.data : [];
            const matchingSub = allSubCats.find((c: SubCat) => c.cat_name === d.cat_name);
            if (matchingSub?.main_cat_name) {
              setSelectedMain(matchingSub.main_cat_name);
            }
          } catch (err) {
            console.error("Failed to load main category:", err);
          }
        }

        setPhotoPreview(toPicUrl(d?.profile_pic) || null);
        setBackgroundPreview(toPicUrl(d?.background_image) || null);
      } catch {
        setForm(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
      if (prevBackgroundObjectUrl.current) URL.revokeObjectURL(prevBackgroundObjectUrl.current);
    };
  }, [id]);

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setPhotoFile(f);

    if (prevObjectUrl.current) {
      URL.revokeObjectURL(prevObjectUrl.current);
      prevObjectUrl.current = null;
    }
    if (f) {
      const obj = URL.createObjectURL(f);
      prevObjectUrl.current = obj;
      setPhotoPreview(obj);
    } else {
      setPhotoPreview(toPicUrl(form?.profile_pic) || null);
    }
  }

  function onPickBackgroundImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setBackgroundImageFile(f);

    if (prevBackgroundObjectUrl.current) {
      URL.revokeObjectURL(prevBackgroundObjectUrl.current);
      prevBackgroundObjectUrl.current = null;
    }
    if (f) {
      const obj = URL.createObjectURL(f);
      prevBackgroundObjectUrl.current = obj;
      setBackgroundPreview(obj);
    } else {
      setBackgroundPreview(toPicUrl(form?.background_image) || null);
    }
  }

  function onRemoveBackgroundImage() {
    setBackgroundImageFile(null);
    setBackgroundPreview(null);
    if (form) {
      setForm({ ...form, background_image: "" });
    }
    if (backgroundFileRef.current) {
      backgroundFileRef.current.value = "";
    }
    if (prevBackgroundObjectUrl.current) {
      URL.revokeObjectURL(prevBackgroundObjectUrl.current);
      prevBackgroundObjectUrl.current = null;
    }
  }

  async function save() {
    if (!form) return;

    // Validate that a category is selected
    if (!selectedSub) {
      notify.error("Please select a Consultant Category.");
      return;
    }

    setSaving(true);
    try {
      const payload: Form = { ...form };
      if (photoFile) {
        const stored = await tryUpload(photoFile);
        payload.profile_pic = stored; // "consultants/<fname>"
      }
      if (backgroundImageFile) {
        const stored = await tryUpload(backgroundImageFile);
        payload.background_image = stored; // "consultants/<fname>"
      }

      // Build consultant_type string from checkboxes
      const selectedTypes: string[] = [];
      if (form.consultant_types.Physical) selectedTypes.push("Physical");
      if (form.consultant_types.Telemedicine) selectedTypes.push("Telemedicine");
      const consultantTypeStr = selectedTypes.length > 0 ? selectedTypes.join(", ") : "Physical";

      // Build schedule JSON with physical/telephonic labels
      const buildForType = (schedule: Record<DayKey, DaySchedule>) => {
        const out: Record<string, { start: string; end: string }[]> = {};
        for (const day of days) {
          const d = schedule[day];
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
          out[day] = slots;
        }
        return out;
      };

      const scheduleData = {
        physical: buildForType(form.schedulePhysical),
      };

      console.log("📅 Schedule being saved:", JSON.stringify(scheduleData, null, 2));

      const r = await fetch(`/api/consultants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultant_id: payload.consultant_id,
          name: payload.name,
          cat_name: selectedSub, // Use selectedSub instead of payload.cat_name
          fee: payload.fee,
          dcd: payload.dcd,
          specialties: payload.specialties,
          education: payload.education,
          aoe: payload.aoe,
          experience: payload.experience,
          schedule: scheduleData,
          profile_pic: payload.profile_pic,
          background_image: payload.background_image,
          employment_status: payload.employment_status,
          doctor_type: payload.doctor_type,
          consultant_type: consultantTypeStr, // Send as comma-separated string
          status: payload.status,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `Failed (${r.status})`);
      }

      notify.success("Consultant updated successfully.");
      router.push("/consultants/view");
    } catch (e: any) {
      notify.error(e?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!form) return <div className="p-6">Not found.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Edit Consultant</h1>

      <div className="mt-6 space-y-6">
        {/* Basic */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Consultant ID</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.consultant_id}
              onChange={(e) => setForm({ ...form, consultant_id: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Main Speciality Category</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 bg-white"
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
          <div>
            <label className="text-sm font-medium">Consultant Category</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 bg-white"
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
          <div>
            <label className="text-sm font-medium">Name</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Consultancy Fee</label>
            <input type="number" className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.fee as any}
              onChange={(e) => setForm({ ...form, fee: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Degree Completion Date</label>
            <input type="date" className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.dcd as any}
              onChange={(e) => setForm({ ...form, dcd: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Doctor Type</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.doctor_type}
              onChange={(e) => setForm({ ...form, doctor_type: e.target.value })}
              placeholder='e.g. "Surgeon" (or leave blank)' />
          </div>
          <div>
            {/* Consultant Type - Hidden/Removed as we only support Physical now */}
            {/* 
            <label className="text-sm font-medium">Consultant Type</label>
            <div className="mt-1 flex flex-col gap-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.consultant_types.Physical}
                  disabled
                  readOnly
                />
                <span>Physical</span>
              </label>
            </div>
            */}
          </div>
        </div>

        {/* Text areas */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Specialties (comma/newline)</label>
            <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.specialties}
              onChange={(e) => setForm({ ...form, specialties: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Areas of Expertise (comma/newline)</label>
            <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.aoe}
              onChange={(e) => setForm({ ...form, aoe: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Education (comma/newline)</label>
          <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.education}
            onChange={(e) => setForm({ ...form, education: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium">Experience</label>
          <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            placeholder="Years of experience and details" />
        </div>

        {/* Physical Consultation Timings */}
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Physical Consultation Timings</h2>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <div className="hidden md:grid md:grid-cols-5 text-sm font-medium text-muted-foreground">
              <div />
              <div className="text-center">Morning Start</div>
              <div className="text-center">Morning End</div>
              <div className="text-center">Evening Start</div>
              <div className="text-center">Evening End</div>
            </div>

            {days.map((d) => (
              <div key={`physical-${d}`} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                <div className="font-medium capitalize">{d}</div>

                <input
                  type="time"
                  step="60"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={form.schedulePhysical[d].morningStart}
                  onChange={(e) => setForm({
                    ...form,
                    schedulePhysical: {
                      ...form.schedulePhysical,
                      [d]: { ...form.schedulePhysical[d], morningStart: e.target.value }
                    }
                  })}
                />

                <input
                  type="time"
                  step="60"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={form.schedulePhysical[d].morningEnd}
                  onChange={(e) => setForm({
                    ...form,
                    schedulePhysical: {
                      ...form.schedulePhysical,
                      [d]: { ...form.schedulePhysical[d], morningEnd: e.target.value }
                    }
                  })}
                />

                <input
                  type="time"
                  step="60"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={form.schedulePhysical[d].eveningStart}
                  onChange={(e) => setForm({
                    ...form,
                    schedulePhysical: {
                      ...form.schedulePhysical,
                      [d]: { ...form.schedulePhysical[d], eveningStart: e.target.value }
                    }
                  })}
                />

                <input
                  type="time"
                  step="60"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  value={form.schedulePhysical[d].eveningEnd}
                  onChange={(e) => setForm({
                    ...form,
                    schedulePhysical: {
                      ...form.schedulePhysical,
                      [d]: { ...form.schedulePhysical[d], eveningEnd: e.target.value }
                    }
                  })}
                />
              </div>
            ))}
          </div>
        </div>



        {/* Upload + employment + surgeon */}
        <div className="rounded-lg border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Profile Picture Upload */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Upload Profile Picture</h3>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full border bg-gray-50 flex items-center justify-center">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="preview" className="h-20 w-20 object-cover" />
                  ) : toPicUrl(form.profile_pic) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={toPicUrl(form.profile_pic)!} alt="current" className="h-20 w-20 object-cover" />
                  ) : (
                    <span className="text-[11px] text-gray-400">No image</span>
                  )}
                </div>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
                <button type="button"
                  onClick={() => { if (fileRef.current) fileRef.current.value = ""; fileRef.current?.click(); }}
                  className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-black/80">
                  Choose Image
                </button>
                {form.profile_pic ? <span className="text-xs text-gray-500">Current file: {form.profile_pic}</span> : null}
              </div>
            </div>

            {/* Background Image Upload */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Upload Background Image</h3>
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
                  ) : toPicUrl(form.background_image) ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={toPicUrl(form.background_image)!} alt="current background" className="h-16 w-24 object-cover" />
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

                <input ref={backgroundFileRef} type="file" accept="image/*" className="hidden" onChange={onPickBackgroundImage} />
                <button type="button"
                  onClick={() => { if (backgroundFileRef.current) backgroundFileRef.current.value = ""; backgroundFileRef.current?.click(); }}
                  className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-black/80">
                  Choose Background
                </button>
                {form.background_image ? <span className="text-xs text-gray-500">Current file: {form.background_image}</span> : null}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium mb-2">Employment</h3>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {(["Permanent", "Visiting", "International Visiting Doctor", "Associate Consultant"] as const).map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2">
                    <input type="radio" name="employment"
                      checked={form.employment_status === opt}
                      onChange={() => setForm({ ...form, employment_status: opt })} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Doctor Type</h3>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox"
                  checked={form.doctor_type?.toLowerCase() === "surgeon"}
                  onChange={(e) => setForm({ ...form, doctor_type: e.target.checked ? "Surgeon" : "" })} />
                <span>Surgeon</span>
              </label>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Status</label>
          <select className="rounded-md border px-3 py-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
            <option value="active">Active</option>
            <option value="inactive">InActive</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving}
            className="rounded-md bg-[#c8e967] px-4 py-2 font-medium text-black hover:bg-[#b9db58] disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <RequirePerm moduleKey="consultants" action="edit">
      <EditConsultantInner />
    </RequirePerm>
  );
}
