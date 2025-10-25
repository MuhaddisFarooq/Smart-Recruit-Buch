"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/notify";
import RequirePerm from "@/components/auth/RequirePerm";

type FormState = {
  test_name: string;
  price: string;
  department: string;
};

export default function AddPathologyPage() {
  return (
    <RequirePerm moduleKey="pathology" action="new">
      <AddPathologyInner />
    </RequirePerm>
  );
}

function AddPathologyInner() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    test_name: "",
    price: "",
    department: "",
  });

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      };

      const res = await fetch("/api/pathology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }

      notify.success("Pathology test added successfully!");
      
      // Reset form
      setForm({
        test_name: "",
        price: "",
        department: "",
      });
    } catch (err: any) {
      console.error("Failed to add pathology test:", err);
      notify.error(err?.message || "Failed to add pathology test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Add Pathology Test</h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter test details to add a new pathology test to the system.
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

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#c8e967] text-black hover:bg-[#b9db58] disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? "Saving..." : "Submit"}
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
