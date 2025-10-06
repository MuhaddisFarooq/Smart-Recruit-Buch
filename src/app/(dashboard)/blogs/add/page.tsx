"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";
import { hasPerm, type PermissionMap } from "@/lib/perms-client";
import CKEditor4 from "@/components/CKEditor4";

type Tag = { tag: string; usage_count: number };

const EDITOR_ID = "blog-desc-editor";

export default function AddBlogPage() {
  const router = useRouter();
  
  // Permission check
  const { data: session } = useSession();
  const perms = (session?.user as any)?.perms as PermissionMap | undefined;
  const canNew = hasPerm(perms, "blogs", "new");
  
  // If no permission, redirect
  useEffect(() => {
    if (session && !canNew) {
      notify.error("You don't have permission to add blog posts.");
      router.push("/blogs/view");
    }
  }, [session, canNew, router]);

  const [title, setTitle] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // one field: Search #Tags
  const [tagQuery, setTagQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // ✅ restored checkboxes
  const [featured, setFeatured] = useState(false);
  const [shareLinkedIn, setShareLinkedIn] = useState(false);

  const [saving, setSaving] = useState(false);

  // fetch hashtag suggestions
  useEffect(() => {
    let ignore = false;
    const q = tagQuery.trim().replace(/^#/, "");
    if (!q) {
      setSuggestions([]);
      return;
    }
    (async () => {
      try {
        setLoadingSuggest(true);
        const res = await fetch(`/api/hashtags?search=${encodeURIComponent(q)}`, { cache: "no-store" });
        const j = await res.json();
        if (!ignore && res.ok) setSuggestions(j.data || []);
      } catch {}
      finally { setLoadingSuggest(false); }
    })();
    return () => { ignore = true; };
  }, [tagQuery]);

  function insertIntoEditor(raw: string) {
    const t = raw.trim().replace(/^#*/, "");
    const text = ` #${t} `;
    if (typeof window !== "undefined" && (window as any).CKEDITOR?.instances?.[EDITOR_ID]) {
      (window as any).CKEDITOR.instances[EDITOR_ID].insertText(text);
      setOpenSuggest(false);
      setTagQuery("");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return notify.error("Title is required.");

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description_html", descriptionHtml);
      fd.append("featured_post", featured ? "1" : "0");           // ✅ featured restored
      fd.append("share_linkedin", shareLinkedIn ? "1" : "0");     // (optional flag for backend/future)
      if (file) fd.append("file", file);

      const res = await fetch("/api/blogs", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      notify.success("Blog post saved.");

      // If checked, open LinkedIn share composer (adjust the public URL if needed)
      if (shareLinkedIn && j?.id && typeof window !== "undefined") {
        const origin = window.location.origin;
        const publicUrl = `${origin}/blogs/${j.id}`; // <- change if your public route differs
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`;
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }

      // reset
      setTitle(""); setDescriptionHtml(""); setFile(null);
      setTagQuery(""); setSuggestions([]); setOpenSuggest(false);
      setFeatured(false); setShareLinkedIn(false);
    } catch (err: any) {
      notify.error(err?.message || "Failed to save blog post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add Blog Post</h1>

      <form onSubmit={submit} className="rounded-xl border bg-white p-5 shadow-sm max-w-4xl space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Title *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Enter the blog title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Search #Tags (with suggestions + insert) */}
          <div className="relative">
            <label className="mb-1 block text-sm font-medium">Search #Tags</label>
            <div className="flex gap-2">
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Type to search popular hashtags, e.g. hospital"
                value={tagQuery}
                onChange={(e) => { setTagQuery(e.target.value); setOpenSuggest(true); }}
                onFocus={() => tagQuery && setOpenSuggest(true)}
              />
              <button
                type="button"
                onClick={() => tagQuery.trim() && insertIntoEditor(tagQuery)}
                className="shrink-0 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                disabled={!tagQuery.trim()}
              >
                Insert
              </button>
            </div>

            {openSuggest && (suggestions.length > 0 || loadingSuggest) && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow">
                {loadingSuggest && <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>}
                {suggestions.map((s) => (
                  <button
                    key={s.tag}
                    type="button"
                    onClick={() => insertIntoEditor(s.tag)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span>#{s.tag}</span>
                    <span className="text-xs text-gray-500">used {s.usage_count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <CKEditor4 id={EDITOR_ID} value={descriptionHtml} onChange={setDescriptionHtml} height={420} />
          <p className="mt-1 text-xs text-gray-500">
            Use <code>#hashtag</code> in your content. We’ll store them automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>

        {/* ✅ restored checkboxes */}
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
            <span>Share on LinkedIn after saving</span>
          </label>
        </div>

        <div>
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
