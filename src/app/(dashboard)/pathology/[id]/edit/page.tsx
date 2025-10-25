"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/notify";
import RequirePerm from "@/components/auth/RequirePerm";

type FormState = {
  test_name: string;
  price: string;
  department: string;
  status: "active" | "inactive";
};

export default function EditPathologyPage() {
  return (
    <RequirePerm moduleKey="pathology" action="edit">
      <EditPathologyInner />
    </RequirePerm>
  );
}

function EditPathologyInner() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState<FormState>({
    test_name: "",
    price: "",
    department: "",
    status: "active",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/pathology/${id}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json.data;

        setForm({
          test_name: data.test_name || "",
          price: data.price != null ? String(data.price) : "",
          department: data.department || "",
          status: data.status || "active",
        });
      } catch (err: any) {
        console.error("Failed to load pathology test:", err);
        notify.error("Failed to load pathology test");
      } finally {
        setFetching(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.test_name.trim()) {
      notify.error("Test Name is required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        test_name: form.test_name.trim(),
        price: form.price ? parseFloat(form.price) : null,
        department: form.department.trim() || null,
        status: form.status,
      };

      const res = await fetch(`/api/pathology/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }

      notify.success("Pathology test updated successfully!");
      router.push("/pathology/view");
    } catch (err: any) {
      console.error("Failed to update pathology test:", err);
      notify.error(err?.message || "Failed to update pathology test");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Edit Pathology Test</h1>
      <p className="mb-6 text-sm text-gray-500">
        Update test details and save changes.
      </p>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Test Name */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Test Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={form.test_name}
              onChange={handleChange("test_name")}
              placeholder="Enter test name"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="mb-1 block text-sm font-medium">Price</label>
            <Input
              type="number"
              step="0.01"
              value={form.price}
              onChange={handleChange("price")}
              placeholder="Enter price"
            />
          </div>
        </div>

        {/* Department */}
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">Department</label>
          <Input
            type="text"
            value={form.department}
            onChange={handleChange("department")}
            placeholder="Enter department name"
          />
        </div>

        {/* Status */}
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            value={form.status}
            onChange={handleChange("status")}
            className="w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#c8e967] text-black hover:bg-[#b9db58] disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? "Saving..." : "Update"}
          </Button>
          <Button
            type="button"
            onClick={() => router.push("/pathology/view")}
            disabled={loading}
            variant="outline"
            className="hover:bg-gray-50"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
