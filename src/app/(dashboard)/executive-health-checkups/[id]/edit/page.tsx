"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";

type Form = {
  title: string;
  price_label: string;
  image?: string | null;
  consultations: string;
  cardiology_tests: string;
  radiology_tests: string;
  lab_tests: string;
  instructions: string;
  status?: "active" | "inactive";
};

export default function EditExecutiveHealthCheckupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onPickFile(f: File | null) {
    setNewImage(f);
    if (!f) return setPreview(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/executive-health-checkups/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error("not found");
        const j = await r.json();
        const d = j?.data;
        setForm({
          title: d?.title ?? "",
          price_label: d?.price_label ?? "",
          image: d?.image ?? null,
          consultations: d?.consultations ?? "",
          cardiology_tests: d?.cardiology_tests ?? "",
          radiology_tests: d?.radiology_tests ?? "",
          lab_tests: d?.lab_tests ?? "",
          instructions: d?.instructions ?? "",
          status: d?.status === "inactive" ? "inactive" : "active",
        });
      } catch {
        setForm(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    if (!form.title.trim() || !form.price_label.trim() || !form.consultations.trim() || !form.instructions.trim()) {
      notify.error("Please fill Title, Price, Consultations and Instructions.");
      return;
    }

    setSaving(true);
    try {
      if (newImage) {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("price_label", form.price_label);
        fd.append("image", newImage);
        fd.append("consultations", form.consultations);
        fd.append("cardiology_tests", form.cardiology_tests);
        fd.append("radiology_tests", form.radiology_tests);
        fd.append("lab_tests", form.lab_tests);
        fd.append("instructions", form.instructions);
        if (form.status) fd.append("status", form.status);

        const r = await fetch(`/api/executive-health-checkups/${id}`, { method: "PATCH", body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || `Failed (${r.status})`);
      } else {
        const r = await fetch(`/api/executive-health-checkups/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || `Failed (${r.status})`);
      }
      notify.success("Health checkup updated.");
      router.push("/executive-health-checkups/view");
    } catch (err: any) {
      notify.error(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!form) return <div className="p-6">Not found.</div>;

  const TA = (p: keyof Form, label: string, ph?: string) => (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-medium">{label}</label>
      <textarea
        className="rounded-md border px-3 py-2 min-h-[96px]"
        placeholder={ph || "One item per line"}
        value={(form[p] as string) || ""}
        onChange={(e) => setForm({ ...form, [p]: e.target.value } as Form)}
      />
    </div>
  );

  const imgUrl = (s?: string | null) => (!s ? undefined : s.startsWith("/") ? s : `/uploads/${s}`);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Edit Executive Health Checkup</h1>

      <form onSubmit={onSubmit} className="mt-6 rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Price Label</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={form.price_label}
              onChange={(e) => setForm({ ...form, price_label: e.target.value })}
            />
          </div>
        </div>

        {/* Current image + replace */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Current Image</label>
            {form.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl(form.image)} alt={form.title} className="h-24 w-24 rounded object-cover border" />
            ) : <span className="text-sm text-gray-500">No image</span>}
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Replace Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              className="rounded-md border px-3 py-2 bg-white"
            />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="mt-2 h-24 w-24 rounded object-cover border" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {TA("consultations", "Consultations")}
          {TA("cardiology_tests", "Cardiology Tests")}
          {TA("radiology_tests", "Radiology Tests")}
          {TA("lab_tests", "Laboratory Tests")}
        </div>

        {TA("instructions", "Instructions", "One instruction per line")}

        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#c8e967] px-4 py-2 font-medium text-black hover:bg-[#b9db58] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
