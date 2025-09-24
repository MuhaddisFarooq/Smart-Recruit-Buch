"use client";
import { toast } from "sonner";

export const notify = {
  success: (msg: string) => toast.success(msg),
  error:   (msg: string) => toast.error(msg),
  info:    (msg: string) => toast.message(msg),
  // handy for async ops:
  promise: toast.promise,
};
