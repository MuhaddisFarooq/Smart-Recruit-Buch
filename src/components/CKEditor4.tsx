"use client";

import { useEffect, useRef } from "react";

type Props = {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (html: string) => void;
  config?: Record<string, any>;
  height?: number | string;
  className?: string;
};

let ckLoader: Promise<void> | null = null;

function loadCK4(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).CKEDITOR) return Promise.resolve();

  if (!ckLoader) {
    ckLoader = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "/ckeditor/ckeditor.js"; // served from /public/ckeditor
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load /ckeditor/ckeditor.js"));
      document.head.appendChild(s);
    });
  }
  return ckLoader;
}

export default function CKEditor4({
  id,
  name,
  value,
  onChange,
  config,
  height = 260,
  className,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useRef<any>(null);
  const lastValueRef = useRef<string | undefined>(value);

  useEffect(() => {
    let disposed = false;

    loadCK4().then(() => {
      if (disposed || !textareaRef.current) return;

      const CKEDITOR: any = (window as any).CKEDITOR;
      if (!CKEDITOR) return;

      const instance = CKEDITOR.replace(textareaRef.current, {
        height,
        removePlugins: "elementspath",
        resize_enabled: false,
        ...(config || {}),
      });

      editorRef.current = instance;

      const initial = value ?? "";
      lastValueRef.current = initial;
      instance.setData(initial);

      instance.on("change", () => {
        const html = instance.getData();
        lastValueRef.current = html;
        onChange?.(html);
      });
    });

    return () => {
      disposed = true;
      try {
        const inst = editorRef.current;
        if (inst) {
          inst.updateElement?.();
          inst.destroy?.();
          editorRef.current = null;
        }
      } catch {
        /* no-op */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep external value in sync (useful on edit pages)
  useEffect(() => {
    const inst = editorRef.current;
    if (inst && value !== undefined && value !== lastValueRef.current) {
      lastValueRef.current = value;
      inst.setData(value);
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      id={id}
      name={name}
      defaultValue={value}
      className={className}
      style={{ display: "none" }}
    />
  );
}
