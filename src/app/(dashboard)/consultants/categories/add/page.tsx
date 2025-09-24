"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/notify";

type MainCat = { id: number; cat_name: string };
type SubCat  = { id: number; cat_name: string; main_cat_id: number };

export default function AddConsultantCategoryPage() {
  const [mainCats, setMainCats]   = useState<MainCat[]>([]);
  const [mainId, setMainId]       = useState<number | "">("");
  const [sub, setSub]             = useState("");
  const [subCats, setSubCats]     = useState<SubCat[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // image state
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");

  const subNormalized = useMemo(() => sub.trim(), [sub]);

  /* ------------------ client-side compression to KB ------------------ */
  async function compressToTarget(
    file: File,
    maxSideStart = 1200,
    targetKB = 300,          // ~300 KB target to ensure "in KB"
    minSide = 600
  ): Promise<Blob> {
    // load image
    const dataURL: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const img = document.createElement("img");
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
      img.src = dataURL;
    });

    let maxSide = maxSideStart;
    let quality = 0.85;

    const draw = () => {
      const ratio = Math.min(maxSide / img.width, maxSide / img.height, 1);
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      return new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", quality)
      );
    };

    // iteratively reduce until <= targetKB
    let blob = await draw();
    while (blob.size > targetKB * 1024 && (quality > 0.5 || maxSide > minSide)) {
      if (quality > 0.55) quality -= 0.07; else maxSide = Math.max(minSide, maxSide - 100);
      blob = await draw();
    }
    return blob;
  }

  async function uploadBlobToCategories(blob: Blob, original = "category.jpg") {
    const fd = new FormData();
    fd.append(
      "file",
      new File([blob], original.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })
    );
    const r = await fetch("/api/uploads?folder=categories", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `Upload failed (HTTP ${r.status})`);
    // returns { ok, filename: "categories/<name>", url: "/uploads/categories/<name>" }
    return String(j?.filename || "");
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setUploadedFilename("");
    setPreview(null);
    if (!f) return;

    try {
      setUploading(true);
      const compressed = await compressToTarget(f, 1200, 300, 600); // ~300KB, min side 600px
      setPreview(URL.createObjectURL(compressed));
      const stored = await uploadBlobToCategories(compressed, f.name);
      setUploadedFilename(stored); // "categories/<filename>"
      notify.success("Image uploaded.");
    } catch (err: any) {
      console.error(err);
      notify.error(err?.message || "Failed to upload image.");
      setUploadedFilename("");
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }
  /* ------------------------------------------------------------------- */

  // load main categories once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/consultants/main-categories", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        setMainCats(Array.isArray(j?.data) ? j.data : []);
      } catch (e) {
        console.error("Failed to load main categories", e);
        setMainCats([]);
        notify.error("Failed to load main categories.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // load subs when a main is selected (by id)
  useEffect(() => {
    if (!mainId || typeof mainId !== "number") {
      setSubCats([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/consultants/categories?main_id=${mainId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        setSubCats(Array.isArray(j?.data) ? j.data : []);
      } catch (e) {
        console.error("Failed to load sub categories", e);
        setSubCats([]);
        notify.error("Failed to load sub categories.");
      }
    })();
  }, [mainId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mainId || typeof mainId !== "number") {
      notify.error("Please select a Main Speciality Category.");
      return;
    }
    if (!subNormalized) {
      notify.error("Please enter a Sub Category Name.");
      return;
    }
    if (subCats.some(s => s.cat_name.toLowerCase() === subNormalized.toLowerCase())) {
      notify.error("That sub category already exists under the selected main category.");
      return;
    }

    try {
      setSaving(true);
      const task = (async () => {
        const res = await fetch("/api/consultants/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            main_cat_id: mainId,
            cat_name: subNormalized,
            // optional: value like "categories/<file>"
            cat_img: uploadedFilename || null,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error ?? `Failed (HTTP ${res.status})`);
        return true;
      })();

      notify.promise(task, {
        loading: "Saving sub category…",
        success: "Sub category saved.",
        error: (e) => (e as Error)?.message || "Could not save sub category.",
      });

      await task;

      // reset
      setSub("");
      setPreview(null);
      setUploadedFilename("");
      if (fileRef.current) fileRef.current.value = "";

      // refresh subs list
      const ref = await fetch(`/api/consultants/categories?main_id=${mainId}`, { cache: "no-store" });
      const j = await ref.json().catch(() => ({}));
      setSubCats(Array.isArray(j?.data) ? j.data : []);
    } catch {
      /* toast already shown */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Add Consultant Category</h1>
      <p className="mb-6 text-sm text-gray-500">
        Select a main speciality category and enter a sub category name.
      </p>

      <form onSubmit={onSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Select Main Speciality Category</label>
            <select
              className="w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm"
              value={mainId}
              onChange={(e) => setMainId(e.target.value ? Number(e.target.value) : "")}
              disabled={loading}
            >
              <option value="">
                {loading ? "Loading..." : "Select Main Speciality Category"}
              </option>
              {!loading &&
                mainCats.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.cat_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Sub Category Name</label>
            <Input
              placeholder="Enter Consultant Sub Category"
              value={sub}
              onChange={(e) => setSub(e.target.value)}
            />
          </div>
        </div>

        {/* Optional image upload to /uploads/categories */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium">
              Category Image <span className="text-gray-500">(optional)</span>
            </label>
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
                onChange={onPickImage}
              />
              <Button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="bg-gray-900 text-white hover:bg-black/80"
              >
                Choose Image
              </Button>
              {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
              {!!uploadedFilename && (
                <span className="text-xs text-gray-600 break-all">{uploadedFilename}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button
            type="submit"
            disabled={!mainId || !subNormalized || saving}
            className="bg-[#c8e967] text-black hover:bg-[#b9db58] disabled:opacity-60 disabled:pointer-events-none"
          >
            {saving ? "Saving..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
