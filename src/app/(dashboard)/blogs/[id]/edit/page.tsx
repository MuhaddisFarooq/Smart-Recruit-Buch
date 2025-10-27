"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { notify } from "@/components/ui/notify";
import { hasPerm, type PermissionMap } from "@/lib/perms-client";
import CKEditor4 from "@/components/CKEditor4";

type Blog = {
  id: number;
  title: string;
  category?: string | null;
  description_html: string | null;
  file_path: string | null;
  featured_post: 0 | 1;
};

export default function EditBlogPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // Permission check
  const { data: session } = useSession();
  const perms = (session?.user as any)?.perms as PermissionMap | undefined;
  const canEdit = hasPerm(perms, "blogs", "edit");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [html, setHtml] = useState("");
  const [featured, setFeatured] = useState(false);
  const [shareLinkedIn, setShareLinkedIn] = useState(false);

  const [existingFile, setExistingFile] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Category suggestions
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);

  // Permission check effect
  useEffect(() => {
    if (session && !canEdit) {
      notify.error("You don't have permission to edit blog posts.");
      router.push("/blogs/view");
    }
  }, [session, canEdit, router]);

  // Fetch existing categories on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/blogs/categories", { cache: "no-store" });
        const j = await res.json();
        if (res.ok) setCategoryList(j.categories || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    })();
  }, []);

  // Filter categories based on input
  useEffect(() => {
    if (!category.trim()) {
      setFilteredCategories(categoryList);
    } else {
      const filtered = categoryList.filter((cat) =>
        cat.toLowerCase().includes(category.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [category, categoryList]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/blogs/${id}`, { cache: "no-store" });

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const txt = await res.text();
          throw new Error(
            `Unexpected response from /api/blogs/${id} (${res.status}). First bytes: ${txt.slice(
              0,
              120
            )}`
          );
        }

        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

        const d: Blog = j.data;
        setTitle(d.title || "");
        setCategory(d.category || "");
        setHtml(d.description_html || "");
        setFeatured(Boolean(d.featured_post));
        setExistingFile(d.file_path || null);
      } catch (e: any) {
        notify.error(e?.message || "Failed to load blog.");
        router.push("/blogs/view");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return notify.error("Title is required.");

    try {
      setSaving(true);
      let res: Response;

      if (file) {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("category", category.trim());
        fd.append("description_html", html);
        fd.append("featured_post", featured ? "1" : "0");
        fd.append("file", file);
        res = await fetch(`/api/blogs/${id}`, { method: "PATCH", body: fd });
      } else {
        res = await fetch(`/api/blogs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            category: category.trim(),
            description_html: html,
            featured_post: featured ? 1 : 0,
          }),
        });
      }

      const ct = res.headers.get("content-type") || "";
      const j = ct.includes("application/json") ? await res.json() : {};
      if (!res.ok) throw new Error((j as any)?.error || `HTTP ${res.status}`);

      notify.success("Blog updated.");

      if (shareLinkedIn) {
        const origin = window.location.origin;
        const publicUrl = `${origin}/blogs/${id}`;
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            publicUrl
          )}`,
          "_blank",
          "noopener,noreferrer"
        );
      }

      router.push("/blogs/view");
    } catch (e: any) {
      notify.error(e?.message || "Failed to update blog.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Edit Blog Post</h1>

      <form
        onSubmit={submit}
        className="rounded-xl border bg-white p-5 shadow-sm max-w-4xl space-y-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Title *</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="relative">
          <label className="mb-1 block text-sm font-medium">Category</label>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Enter blog category (e.g., Healthcare, Technology, News)"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setShowCategorySuggestions(true);
            }}
            onFocus={() => setShowCategorySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
          />
          {showCategorySuggestions && filteredCategories.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
              {filteredCategories.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  onMouseDown={() => {
                    setCategory(cat);
                    setShowCategorySuggestions(false);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <CKEditor4 value={html} onChange={setHtml} height={420} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Replace File (optional)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {existingFile && (
              <div className="mt-1 text-xs text-gray-500">
                Current:{" "}
                <a
                  className="text-blue-600 underline"
                  href={
                    existingFile.startsWith("/")
                      ? existingFile
                      : `/uploads/${existingFile}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {existingFile.split("/").pop()}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            <span>Featured Post</span>
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shareLinkedIn}
              onChange={(e) => setShareLinkedIn(e.target.checked)}
            />
            <span>Share on LinkedIn after save</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
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
