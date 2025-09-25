// src/app/(dashboard)/insurance/corporate/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/components/ui/notify";

type Data = {
  id: number;
  name: string;
  profile: string;
  address: string;
  logo: string | null;
};

const toUrl = (s?: string | null) =>
  !s ? undefined : s.startsWith("/") ? s : `/uploads/${s}`;

export default function EditInsuranceCorporatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Data | null>(null);

  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [address, setAddress] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/insurance/corporate/${id}`, { cache: "no-store" });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        const d = j?.data as Data;
        setData(d);
        setName(d?.name ?? "");
        setProfile(d?.profile ?? "");
        setAddress(d?.address ?? "");
        setLogoPreview(toUrl(d?.logo));
      } catch (e: any) {
        notify.error(e?.message || "Failed to load corporate entry.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("profile", profile.trim());
      fd.append("address", address.trim());
      if (logoFile) fd.append("logo", logoFile);

      const task = (async () => {
        const r = await fetch(`/api/insurance/corporate/${id}`, {
          method: "PATCH",
          body: fd,
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return true;
      })();

      await notify.promise(task, {
        loading: "Updating…",
        success: "Corporate updated.",
        error: (e) => (e as Error)?.message || "Update failed.",
      });

      router.push("/insurance/corporate/view");
    } catch {
      // toast already shown
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!data) return <div className="p-6">Not found.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Edit Insurance Corporate</h1>

      <form onSubmit={onSubmit} className="mt-4 rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Name</label>
            <input
              className="rounded-md border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Corporate Name"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Address</label>
            <input
              className="rounded-md border px-3 py-2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Corporate Address"
              required
            />
          </div>

          <div className="md:col-span-2 flex flex-col">
            <label className="mb-1 text-sm font-medium">Profile</label>
            <textarea
              className="min-h-[120px] rounded-md border px-3 py-2"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              placeholder="Corporate Profile"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Logo (optional)</label>
            <div className="flex items-center gap-4">
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} className="h-16 w-16 rounded object-cover border" alt="logo preview" />
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#c8e967] px-4 py-2 font-medium text-black hover:bg-[#b9db58] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
