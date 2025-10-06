"use client";

import React, { useMemo, useRef, useState } from "react";
import { notify } from "@/components/ui/notify";
import RequirePerm from "@/components/auth/RequirePerm";

type ImportResult = {
  ok: boolean;
  inserted?: number;
  skipped?: number;
  errors?: Array<{ row: number; message: string }>;
  error?: string;
};

const SAMPLE_URL = "/sample-data/consultants_import_sample.xlsx";

function ImportConsultantsInner() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [ack, setAck] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canSubmit = useMemo(() => !!file && ack && !submitting, [file, ack, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const task: Promise<ImportResult> = (async () => {
        const res = await fetch("/api/consultants/import", { method: "POST", body: fd });
        const ct = res.headers.get("content-type") || "";
        let body: any = null;
        try {
          body = ct.includes("application/json") ? await res.json() : await res.text();
        } catch {
          // ignore
        }

        if (!res.ok) {
          const message =
            (body && typeof body === "object" && (body.error || body.message)) ||
            (typeof body === "string" && body) ||
            `HTTP ${res.status}`;
          throw new Error(message);
        }

        const serverOk =
          typeof body === "object" && body !== null && "ok" in body ? !!(body as any).ok : true;

        if (!serverOk) {
          const message =
            (body && typeof body === "object" && (body.error || body.message)) ||
            "Import reported failure.";
          throw new Error(message);
        }

        const normalized: ImportResult = {
          ok: true,
          inserted:
            typeof (body as any)?.inserted === "number"
              ? (body as any).inserted
              : (body as any)?.count ?? undefined,
          skipped: typeof (body as any)?.skipped === "number" ? (body as any).skipped : undefined,
          errors: Array.isArray((body as any)?.errors) ? (body as any).errors : undefined,
        };

        return normalized;
      })();

      notify.promise(task, {
        loading: "Importing consultants…",
        success: "Import completed successfully.",
        error: (e) => (e as Error)?.message || "Import failed.",
      });

      const out = await task;
      setResult(out);
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || "Import failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Import From Excel</h1>
      <p className="mt-1 text-sm text-gray-600">
        Upload <strong>.xlsx</strong> or <strong>.csv</strong> to bulk import consultants.
      </p>

      {/* Instructions */}
      <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Instructions</h2>

        <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-700">
          <li>
            Your file must contain these <strong>column headers</strong> (exact spelling required):
            <div className="mt-1 rounded-md bg-gray-50 p-3 text-xs font-mono leading-5">
              consultant_id, name, main_category, category, fee, dcd,
              specialties, education, aoe, employment_status, is_surgeon, profile_pic,
              monday_morning_start, monday_morning_end, monday_evening_start, monday_evening_end,
              tuesday_morning_start, tuesday_morning_end, tuesday_evening_start, tuesday_evening_end,
              wednesday_morning_start, wednesday_morning_end, wednesday_evening_start, wednesday_evening_end,
              thursday_morning_start, thursday_morning_end, thursday_evening_start, thursday_evening_end,
              friday_morning_start, friday_morning_end, friday_evening_start, friday_evening_end,
              saturday_morning_start, saturday_morning_end, saturday_evening_start, saturday_evening_end,
              sunday_morning_start, sunday_morning_end, sunday_evening_start, sunday_evening_end
            </div>
          </li>
          <li>
            <strong>Degree Completion Date</strong> (dcd) must be{" "}
            <code className="bg-gray-100 px-1 rounded">YYYY-MM-DD</code>.
          </li>
          <li>
            <strong>Specialties</strong>, <strong>Education</strong>, and <strong>Areas of Expertise</strong>{" "}
            (aoe) can be comma- or newline-separated lists.
          </li>
          <li>
            <strong>Employment Status</strong> must be one of: Permanent, Visiting,
            International Visiting Doctor, Associate Consultant.
          </li>
          <li>
            <strong>Is Surgeon</strong> can be <code>yes/no</code>, <code>true/false</code> or <code>1/0</code>.
          </li>
          <li>
            <strong>Time columns</strong> use 24-hour <code>HH:MM</code>; blank cells are allowed.
          </li>
          <li>
            <strong>Category</strong> is your sub-category name. It will be stored in the consultant’s category field.
          </li>
        </ol>

        <label className="mt-4 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
          />
          <span>I’ve read the instructions above and my file follows the required format.</span>
        </label>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.open(SAMPLE_URL, "_blank")}
            disabled={!ack}
            className={
              "rounded-md px-3 py-2 text-sm font-medium text-white shadow " +
              (ack ? "bg-gray-900 hover:bg-black/80" : "bg-gray-300 cursor-not-allowed")
            }
            title={!ack ? "Please confirm you’ve read the instructions" : "Download sample file"}
          >
            Download Sample (.xlsx)
          </button>
          <span className="text-xs text-gray-500">
            * Use this as a template; you can also upload .csv.
          </span>
        </div>
      </div>

      {/* Upload form */}
      <form onSubmit={onSubmit} className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Upload</h2>

        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-black/80"
          />
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              setFile(null);
              setResult(null);
              notify.info("Cleared file selection.");
            }}
          >
            Clear
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className={
              "rounded-md px-4 py-2 text-sm font-medium text-black shadow " +
              (canSubmit ? "bg-[#c8e967] hover:bg-[#b9db58]" : "bg-gray-200 cursor-not-allowed text-gray-500")
            }
          >
            {submitting ? "Importing…" : "Submit"}
          </button>
        </div>

        {/* Result */}
        {!!result && (
          <div className="mt-4 rounded-md border bg-gray-50 p-3 text-sm">
            {result.ok ? (
              <div className="text-green-700">
                Imported successfully. Inserted: <strong>{result.inserted ?? 0}</strong>, Skipped:{" "}
                <strong>{result.skipped ?? 0}</strong>.
                {!!result.errors?.length && (
                  <div className="mt-2 text-red-700">
                    Some rows had issues:
                    <ul className="list-disc pl-5">
                      {result.errors.slice(0, 10).map((e, i) => (
                        <li key={i}>
                          Row {e.row}: {e.message}
                        </li>
                      ))}
                    </ul>
                    {result.errors.length > 10 && (
                      <div>…and {result.errors.length - 10} more.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-700">
                Import failed: <strong>{result.error || "Unknown error"}</strong>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <RequirePerm moduleKey="consultants" action="import">
      <ImportConsultantsInner />
    </RequirePerm>
  );
}
