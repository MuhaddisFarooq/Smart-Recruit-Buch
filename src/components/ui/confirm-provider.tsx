"use client";

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Options for confirm() */
export type ConfirmOpts = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  dangerous?: boolean; // red confirm button
};

type ConfirmFn = (opts?: ConfirmOpts) => Promise<boolean>;

const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmCtx);
  if (!fn) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return fn;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOpts>({});
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o || {});
    setOpen(true);
    return new Promise<boolean>((resolve) => setResolver(() => resolve));
  }, []);

  const onClose = (v: boolean) => {
    setOpen(false);
    resolver?.(v);
    setResolver(null);
  };

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmCtx.Provider value={value}>
      {children}
      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-lg font-semibold">{opts.title || "Are you sure?"}</h3>
              <button className="rounded p-1 text-gray-500 hover:bg-gray-100" onClick={() => onClose(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-4 text-sm text-gray-700">
              {opts.description || "Please confirm this action."}
            </div>
            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button
                onClick={() => onClose(false)}
                className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              >
                {opts.cancelText || "Cancel"}
              </button>
              <button
                onClick={() => onClose(true)}
                className={
                  "rounded-md px-3 py-2 text-sm text-white " +
                  (opts.dangerous
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-gray-900 hover:bg-black/80")
                }
              >
                {opts.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmCtx.Provider>
  );
}
