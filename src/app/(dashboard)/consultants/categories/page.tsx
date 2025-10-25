"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { notify } from "@/components/ui/notify";
import { useConfirm } from "@/components/ui/confirm-provider";
import RequirePerm from "@/components/auth/RequirePerm";
import { useSession } from "next-auth/react";
import { hasPerm, type PermissionMap } from "@/lib/perms-client";
import ExportButton from "@/components/common/ExportButton";
import { Button } from "@/components/ui/button";

type Row = {
  id: number;
  cat_name: string;
  main_cat_id: number | null;
  main_cat_name: string | null;
  cat_description: string | null;
  cat_img: string | null;
};
type MainCat = { id: number; cat_name: string };

function CategoriesInner() {
  const { data } = useSession();
  const perms = (data?.user as any)?.perms as PermissionMap | undefined;

  const canEdit = hasPerm(perms, "consultants", "edit");
  const canDelete = hasPerm(perms, "consultants", "delete");
  const canExport = hasPerm(perms, "consultants", "export");

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Row | null>(null);
  const [mains, setMains] = useState<MainCat[]>([]);
  const [saving, setSaving] = useState(false);

  // Image upload state for edit dialog
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");

  const confirm = useConfirm();

  // Export configuration
  const exportColumns = [
    { key: "id", header: "ID", width: 10 },
    { key: "cat_name", header: "Category Name", width: 25 },
    { key: "main_cat_name", header: "Main Category", width: 25 },
    { key: "cat_description", header: "Description", width: 40 },
  ];

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/consultants/main-categories", { cache: "no-store" });
        const j = await r.json();
        setMains(Array.isArray(j?.data) ? j.data : []);
      } catch {
        setMains([]);
        notify.error("Failed to load main categories.");
      }
    })();
  }, []);

  async function reload() {
    try {
      const r = await fetch(
        `/api/consultants/categories?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(
          search
        )}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      setRows(Array.isArray(j?.data) ? j.data : []);
      setTotal(Number(j?.total || 0));
    } catch {
      setRows([]);
      setTotal(0);
      notify.error("Failed to load categories.");
    }
  }

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageNumbers = useMemo(() => {
    const max = totalPages;
    const current = page;
    const span = 2;
    const start = Math.max(1, current - span);
    const end = Math.min(max, current + span);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, totalPages]);

  function openEdit(row: Row) {
    if (!canEdit) return;
    setEditing(row);
    // Set initial image preview if exists
    if (row.cat_img) {
      setPreview(`/uploads/categories/${row.cat_img}`);
      setUploadedFilename(row.cat_img);
    } else {
      setPreview(null);
      setUploadedFilename("");
    }
  }
  function closeEdit() {
    setEditing(null);
    setPreview(null);
    setUploadedFilename("");
    if (fileRef.current) fileRef.current.value = "";
  }

  // Image compression and upload functions
  async function compressToTarget(
    file: File,
    maxSideStart = 1200,
    targetKB = 300,
    minSide = 600
  ): Promise<Blob> {
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
    
    const isPNG = file.type === "image/png";

    const draw = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const nw = Math.max(minSide, Math.floor(w * scale));
      const nh = Math.max(minSide, Math.floor(h * scale));

      const canvas = document.createElement("canvas");
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext("2d")!;
      
      if (!isPNG) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, nw, nh);
      }
      
      ctx.drawImage(img, 0, 0, nw, nh);

      return new Promise<Blob | null>((res) => {
        canvas.toBlob(res, isPNG ? "image/png" : "image/jpeg", quality);
      });
    };

    let blob = await draw();
    if (!blob) throw new Error("Failed to compress");

    while (blob.size > targetKB * 1024 && (maxSide > minSide || quality > 0.5)) {
      if (maxSide > minSide) maxSide -= 100;
      else quality -= 0.05;
      blob = await draw();
      if (!blob) throw new Error("Failed to compress");
    }

    return blob;
  }

  async function uploadBlobToCategories(blob: Blob, original = "category.jpg") {
    const fd = new FormData();
    
    const isPNG = blob.type === "image/png";
    const extension = isPNG ? ".png" : ".jpg";
    const fileName = original.replace(/\.[^.]+$/, extension);
    
    fd.append(
      "file",
      new File([blob], fileName, { type: blob.type })
    );
    const r = await fetch("/api/uploads?folder=categories", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `Upload failed (HTTP ${r.status})`);
    return String(j?.filename || "");
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    if (!f) return;

    try {
      setUploading(true);
      const compressed = await compressToTarget(f, 1200, 300, 600);
      setPreview(URL.createObjectURL(compressed));
      const stored = await uploadBlobToCategories(compressed, f.name);
      setUploadedFilename(stored);
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

  // -------- Updater (JSON first; graceful fallbacks) --------
  async function updateCategory(id: number, data: { cat_name: string; main_cat_id: number; cat_description?: string | null; cat_img?: string | null }) {
    const jsonBody = JSON.stringify({ id, ...data });

    const send = async (method: string, url: string, headers: Record<string, string>, body: BodyInit) => {
      const res = await fetch(url, { method, headers, body });
      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json")
        ? await res.json().catch(() => ({}))
        : await res.text().catch(() => "");
      if (!res.ok) {
        const msg =
          (typeof payload === "object" && payload && (payload as any).error) ||
          (typeof payload === "string" && payload) ||
          `HTTP ${res.status}`;
        const err: any = new Error(msg);
        err.status = res.status;
        throw err;
      }
      return payload;
    };

    // 1) PATCH JSON /:id
    try {
      return await send(
        "PATCH",
        `/api/consultants/categories/${id}`,
        { "Content-Type": "application/json" },
        jsonBody
      );
    } catch (e: any) {
      if (e?.status !== 404 && e?.status !== 405) throw e;
    }

    // 2) PUT JSON /:id
    try {
      return await send(
        "PUT",
        `/api/consultants/categories/${id}`,
        { "Content-Type": "application/json" },
        jsonBody
      );
    } catch (e: any) {
      if (e?.status !== 404 && e?.status !== 405) throw e;
    }

    // 3) POST JSON + override
    try {
      return await send(
        "POST",
        `/api/consultants/categories`,
        { "Content-Type": "application/json", "X-HTTP-Method-Override": "PATCH" },
        jsonBody
      );
    } catch (e: any) {
      if (e?.status !== 404 && e?.status !== 405) throw e;
    }

    // 4) POST JSON /:id with override
    try {
      return await send(
        "POST",
        `/api/consultants/categories/${id}`,
        { "Content-Type": "application/json", "X-HTTP-Method-Override": "PATCH" },
        jsonBody
      );
    } catch (e: any) {
      if (e?.status !== 404 && e?.status !== 405) throw e;
    }

    // 5) LAST RESORT: urlencoded
    const form = new URLSearchParams();
    form.set("id", String(id));
    form.set("cat_name", data.cat_name);
    form.set("main_cat_id", String(data.main_cat_id));
    if (data.cat_description !== undefined) form.set("cat_description", data.cat_description ?? "");
    if (data.cat_img !== undefined) form.set("cat_img", data.cat_img ?? "");
    return await send(
      "POST",
      `/api/consultants/categories?id=${encodeURIComponent(String(id))}`,
      { "Content-Type": "application/x-www-form-urlencoded", "X-HTTP-Method-Override": "PATCH" },
      form
    );
  }
  // -----------------------------------------------------------

  async function saveEdit() {
    if (!editing || !canEdit) return;

    const name = String(editing.cat_name || "").trim();
    const mainId =
      editing.main_cat_id == null || Number.isNaN(editing.main_cat_id as any)
        ? null
        : Number(editing.main_cat_id);
    const desc = editing.cat_description ?? null;
    const catImg = uploadedFilename || null;

    if (!name) {
      notify.error("Category name is required.");
      return;
    }
    if (mainId == null) {
      notify.error("Please select a Main Category.");
      return;
    }

    try {
      setSaving(true);
      await notify.promise(
        updateCategory(editing.id, { cat_name: name, main_cat_id: mainId, cat_description: desc, cat_img: catImg }),
        {
          loading: "Saving category…",
          success: "Category updated.",
          error: (e) => (e as Error)?.message || "Could not save.",
        }
      );
      closeEdit();
      await reload();
    } catch (e: any) {
      notify.error(e?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function del(id: number) {
    if (!canDelete) return;

    const ok = await confirm({
      title: "Delete this category?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      dangerous: true,
    });
    if (!ok) return;

    try {
      await notify.promise(
        (async () => {
          const res = await fetch(`/api/consultants/categories/${id}`, { method: "DELETE" });
          const j = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(j?.error || `Failed (HTTP ${res.status})`);
          return true;
        })(),
        {
          loading: "Deleting…",
          success: "Category deleted.",
          error: (e) => (e as Error)?.message || "Could not delete.",
        }
      );
      setRows((r) => r.filter((x) => x.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      notify.error(e?.message || "Could not delete.");
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">View Consultant Departments</h1>
        
        <div className="flex items-center gap-2">
          {canExport && (
            <ExportButton
              data={rows}
              columns={exportColumns}
              filename="consultant_categories_export"
              title="Consultant Categories Report"
              disabled={loading}
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select
              className="rounded-md border px-2 py-1"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span>Search:</span>
            <input
              className="w-60 rounded-md border px-2 py-1"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-sm">
                <th className="w-16 border px-3 py-2">ID</th>
                <th className="border px-3 py-2">Category Name</th>
                <th className="border px-3 py-2">Main Category Name</th>
                <th className="border px-3 py-2">Description</th>
                <th className="w-32 border px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="border px-3 py-6 text-center text-sm">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border px-3 py-6 text-center text-sm">
                    No records
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                    <td className="border px-3 py-2 text-sm">{r.id}</td>
                    <td className="border px-3 py-2 text-sm">{r.cat_name}</td>
                    <td className="border px-3 py-2 text-sm">{r.main_cat_name ?? ""}</td>
                    <td className="border px-3 py-2 text-sm">
                      {r.cat_description
                        ? r.cat_description.length > 120
                          ? r.cat_description.slice(0, 120) + "…"
                          : r.cat_description
                        : ""}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(r)}
                            className="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                            title="Edit"
                          >
                            ✓
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => del(r.id)}
                            className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                            title="Delete"
                          >
                            🗑
                          </button>
                        )}
                        {!canEdit && !canDelete && <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            Showing {rows.length ? (page - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(page * pageSize, total)} of {total} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            {pageNumbers[0] > 1 && (
              <>
                <PageBtn n={1} active={page === 1} onClick={() => setPage(1)} />
                <span className="px-1">…</span>
              </>
            )}
            {pageNumbers.map((n) => (
              <PageBtn key={n} n={n} active={page === n} onClick={() => setPage(n)} />
            ))}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                <span className="px-1">…</span>
                <PageBtn
                  n={totalPages}
                  active={page === totalPages}
                  onClick={() => setPage(totalPages)}
                />
              </>
            )}
            <button
              className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {editing && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <div className="mb-3 text-lg font-semibold">Edit Category</div>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Category Name</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={editing.cat_name}
                onChange={(e) => setEditing({ ...editing, cat_name: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium">Main Category</label>
              <select
                className="w-full rounded-md border bg-white px-3 py-2"
                value={editing.main_cat_id ?? ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    main_cat_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="" disabled>
                  Select…
                </option>
                {mains.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.cat_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                className="w-full min-h-[100px] rounded-md border px-3 py-2 text-sm"
                placeholder="Describe this category…"
                value={editing.cat_description ?? ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    cat_description: e.target.value,
                  })
                }
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Category Image</label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-gray-50">
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
                  disabled={uploading}
                >
                  {uploading ? "Uploading…" : "Choose Image"}
                </Button>
              </div>
              {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
              {!!uploadedFilename && (
                <span className="break-all text-xs text-gray-600">{uploadedFilename}</span>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={closeEdit}
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageBtn({
  n,
  active,
  onClick,
}: {
  n: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-w-[2rem] rounded-md border px-2 py-1 ${
        active ? "border-lime-600 bg-lime-600 text-white" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      {n}
    </button>
  );
}

export default function Page() {
  return (
    <RequirePerm moduleKey="consultants" action="view">
      <CategoriesInner />
    </RequirePerm>
  );
}
