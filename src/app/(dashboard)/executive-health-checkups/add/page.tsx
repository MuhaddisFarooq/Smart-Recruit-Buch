"use client";

import { useState } from "react";
import { notify } from "@/components/ui/notify";

type FormText = {
  title: string;
  price_label: string;
  consultations: string;
  cardiology_tests: string;
  radiology_tests: string;
  lab_tests: string;
  instructions: string;
};

export default function AddExecutiveHealthCheckupPage() {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormText>({
    title: "",
    price_label: "",
    consultations: "",
    cardiology_tests: "",
    radiology_tests: "",
    lab_tests: "",
    instructions: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function onPickFile(f: File | null) {
    setImageFile(f);
    if (!f) return setPreview(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.price_label || !form.consultations || !form.instructions) {
      notify.error("Please fill Title, Price, Consultations, and Instructions.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("price_label", form.price_label);
      if (imageFile) fd.append("image", imageFile);
      fd.append("consultations", form.consultations);
      fd.append("cardiology_tests", form.cardiology_tests);
      fd.append("radiology_tests", form.radiology_tests);
      fd.append("lab_tests", form.lab_tests);
      fd.append("instructions", form.instructions);
      fd.append("status", "active");

      const res = await fetch("/api/executive-health-checkups", {
        method: "POST",
        body: fd, // don't set content-type
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      notify.success("Health checkup saved!");
      setForm({
        title: "",
        price_label: "",
        consultations: "",
        cardiology_tests: "",
        radiology_tests: "",
        lab_tests: "",
        instructions: "",
      });
      onPickFile(null);
    } catch (err: any) {
      notify.error(err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const TA = (p: keyof FormText, label: string, ph?: string) => (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-medium">{label}</label>
      <textarea
        className="rounded-md border px-3 py-2 min-h-[96px]"
        placeholder={ph || "One item per line"}
        value={form[p]}
        onChange={(e) => setForm({ ...form, [p]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Add Executive Health Checkup</h1>

      <form onSubmit={onSubmit} className="mt-4 rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Title</label>
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Premiere Male Executive Health Checkup"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Price Label</label>
            <input
              className="rounded-md border px-3 py-2"
              placeholder="PKR 40,000"
              value={form.price_label}
              onChange={(e) => setForm({ ...form, price_label: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Image */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium">Image</label>
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {TA("consultations", "Consultations")}
          {TA("cardiology_tests", "Cardiology Tests")}
          {TA("radiology_tests", "Radiology Tests")}
          {TA("lab_tests", "Laboratory Tests")}
        </div>

        {TA("instructions", "Instructions", "One instruction per line")}

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
