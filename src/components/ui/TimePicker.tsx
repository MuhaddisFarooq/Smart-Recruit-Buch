"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";

type Props = {
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  id?: string;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export default function TimePicker({ value, onChange, placeholder, id }: Props) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");
  const [ap, setAp] = useState<"AM" | "PM">("AM");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = (value ?? "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m) {
      setHour(pad(+m[1]));
      setMinute(m[2]);
      setAp(m[3].toUpperCase() as "AM" | "PM");
    }
  }, [value]);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, [open]);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => pad(i + 1)), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => pad(i)), []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm shadow-sm"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder || "--:-- --"}
        </span>
        <Clock className="h-4 w-4 opacity-70" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[260px] rounded-lg border bg-white p-3 shadow-xl">
          <div className="grid grid-cols-3 gap-3">
            <div className="max-h-48 overflow-auto rounded-md border">
              {hours.map((h) => (
                <button
                  key={h}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${h === hour ? "bg-gray-100 font-semibold" : ""}`}
                  onClick={() => setHour(h)}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="max-h-48 overflow-auto rounded-md border">
              {minutes.map((m) => (
                <button
                  key={m}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${m === minute ? "bg-gray-100 font-semibold" : ""}`}
                  onClick={() => setMinute(m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {(["AM", "PM"] as const).map((k) => (
                <button
                  key={k}
                  className={`rounded-md border px-3 py-2 text-sm ${ap === k ? "bg-gray-900 text-white" : "bg-white"}`}
                  onClick={() => setAp(k)}
                >
                  {k}
                </button>
              ))}
              <button
                className="mt-auto rounded-md bg-lime-600 px-3 py-2 text-sm font-medium text-white hover:bg-lime-700"
                onClick={() => {
                  onChange(`${hour}:${minute} ${ap}`);
                  setOpen(false);
                }}
              >
                Set time
              </button>
              <button
                className="rounded-md border px-3 py-2 text-sm"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">Format: hh:mm AM/PM</div>
        </div>
      )}
    </div>
  );
}
