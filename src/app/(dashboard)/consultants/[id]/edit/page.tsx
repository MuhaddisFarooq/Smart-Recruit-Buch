"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";
import RequirePerm from "@/components/auth/RequirePerm";
import { parseTime, convertTo12Hour } from "@/lib/timeHelpers";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

type TimeSlot = { 
  start: string; 
  end: string;
};

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
  schedule: Record<DayKey, TimeSlot[]>;
  profile_pic: string;           // store "consultants/<file>" in DB
  employment_status: string;
  doctor_type: string;
  status: "active" | "inactive";
};

const days: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

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
  const fileRef = useRef<HTMLInputElement | null>(null);
  const prevObjectUrl = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/consultants/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error("not found");
        const j = await r.json();
        const d = j?.data;

        const scheduleObj: Form["schedule"] = (() => {
          try {
            const o = JSON.parse(d?.schedule || "{}");
            const out: any = {};
            for (const k of days) {
              const daySlots = Array.isArray(o?.[k]) ? o[k] : [];
              // Parse existing times - convert from 12-hour with AM/PM back to 24-hour
              out[k] = daySlots.map((slot: any) => {
                const startParsed = parseTime(slot.start || "");
                const endParsed = parseTime(slot.end || "");
                return {
                  start: startParsed?.time || slot.start || "",
                  end: endParsed?.time || slot.end || "",
                };
              });
            }
            return out;
          } catch {
            return { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
          }
        })();

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
          schedule: scheduleObj,
          profile_pic: d?.profile_pic ?? "",
          employment_status: d?.employment_status ?? "",
          doctor_type: d?.doctor_type ?? "",
          status: d?.status === "inactive" ? "inactive" : "active",
        });

        setPhotoPreview(toPicUrl(d?.profile_pic) || null);
      } catch {
        setForm(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => { if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current); };
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

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const payload: Form = { ...form };
      if (photoFile) {
        const stored = await tryUpload(photoFile);
        payload.profile_pic = stored; // "consultants/<fname>"
      }

      // Convert schedule times to include AM/PM
      const scheduleWithAMPM: Record<string, { start: string; end: string }[]> = {};
      for (const [day, slots] of Object.entries(payload.schedule)) {
        scheduleWithAMPM[day] = slots.map((slot) => ({
          start: slot.start ? convertTo12Hour(slot.start) : "",
          end: slot.end ? convertTo12Hour(slot.end) : "",
        }));
      }
      payload.schedule = scheduleWithAMPM as any;
      
      console.log("📅 Schedule being saved:", JSON.stringify(scheduleWithAMPM, null, 2));

      const r = await fetch(`/api/consultants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
  if (!form)   return <div className="p-6">Not found.</div>;

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
                   onChange={(e) => setForm({ ...form, consultant_id: e.target.value })}/>
          </div>
          <div>
            <label className="text-sm font-medium">Consultant Category</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2"
                   value={form.cat_name}
                   onChange={(e) => setForm({ ...form, cat_name: e.target.value })}/>
          </div>
          <div>
            <label className="text-sm font-medium">Name</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2"
                   value={form.name}
                   onChange={(e) => setForm({ ...form, name: e.target.value })}/>
          </div>
          <div>
            <label className="text-sm font-medium">Consultancy Fee</label>
            <input type="number" className="mt-1 w-full rounded-md border px-3 py-2"
                   value={form.fee as any}
                   onChange={(e) => setForm({ ...form, fee: e.target.value })}/>
          </div>
          <div>
            <label className="text-sm font-medium">Degree Completion Date</label>
            <input type="date" className="mt-1 w-full rounded-md border px-3 py-2"
                   value={form.dcd as any}
                   onChange={(e) => setForm({ ...form, dcd: e.target.value })}/>
          </div>
          <div>
            <label className="text-sm font-medium">Doctor Type</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2"
                   value={form.doctor_type}
                   onChange={(e) => setForm({ ...form, doctor_type: e.target.value })}
                   placeholder='e.g. "Surgeon" (or leave blank)'/>
          </div>
        </div>

        {/* Text areas */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Specialties (comma/newline)</label>
            <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2"
                      value={form.specialties}
                      onChange={(e) => setForm({ ...form, specialties: e.target.value })}/>
          </div>
          <div>
            <label className="text-sm font-medium">Areas of Expertise (comma/newline)</label>
            <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2"
                      value={form.aoe}
                      onChange={(e) => setForm({ ...form, aoe: e.target.value })}/>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Education (comma/newline)</label>
          <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2"
                    value={form.education}
                    onChange={(e) => setForm({ ...form, education: e.target.value })}/>
        </div>
        
        <div>
          <label className="text-sm font-medium">Experience</label>
          <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    placeholder="Years of experience and details"/>
        </div>

        {/* Timings */}
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Please Enter Consultant Timings Below…</h2>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {days.map((d) => (
              <div key={d} className="grid grid-cols-1 items-center gap-2 md:grid-cols-5">
                <div className="font-medium capitalize">{d}</div>
                {Array.from({ length: 2 }).map((_, idx) => {
                  const slot = form.schedule[d][idx] || { start: "", end: "" };
                  return (
                    <div key={idx} className="col-span-2 grid grid-cols-2 gap-2">
                      {/* Start Time */}
                      <input 
                        type="time"
                        step="60"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                        value={slot.start}
                        onChange={(e) => {
                          const next = { ...form };
                          next.schedule[d][idx] = { ...slot, start: e.target.value };
                          setForm(next);
                        }}
                      />
                      
                      {/* End Time */}
                      <input 
                        type="time"
                        step="60"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                        value={slot.end}
                        onChange={(e) => {
                          const next = { ...form };
                          next.schedule[d][idx] = { ...slot, end: e.target.value };
                          setForm(next);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Upload + employment + surgeon */}
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-3">Upload Picture</h2>
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

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto}/>
            <button type="button"
                    onClick={() => { if (fileRef.current) fileRef.current.value = ""; fileRef.current?.click(); }}
                    className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-black/80">
              Choose Image
            </button>
            {form.profile_pic ? <span className="text-xs text-gray-500">Current file: {form.profile_pic}</span> : null}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium mb-2">Employment</h3>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {(["Permanent","Visiting","International Visiting Doctor","Associate Consultant"] as const).map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2">
                    <input type="radio" name="employment"
                           checked={form.employment_status === opt}
                           onChange={() => setForm({ ...form, employment_status: opt })}/>
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
                       onChange={(e) => setForm({ ...form, doctor_type: e.target.checked ? "Surgeon" : "" })}/>
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
