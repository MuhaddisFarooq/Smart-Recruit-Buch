// src/app/api/insurance/_helpers.ts
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function actorFromSession() {
  const session = await getServerSession(authOptions).catch(() => null);
  return session?.user?.email || session?.user?.name || "system";
}

export async function saveCompressedJpeg(
  file: File,
  subfolder: "company" | "corporate"
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const arr = await file.arrayBuffer();
  const input = Buffer.from(arr as ArrayBuffer);

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "insurance", subfolder);
  await ensureDir(uploadsDir);

  const base = sanitizeName(file.name || "logo.jpg");
  const outName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${base}`.replace(
    /\.(png|webp|gif|bmp|tiff)$/i,
    ".jpg"
  );
  const absOut = path.join(uploadsDir, outName);

  // ~80–85% quality to keep files in KB range while preserving quality
  await sharp(input).rotate().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(absOut);

  // Stored relative path (served at /uploads/…)
  return `insurance/${subfolder}/${outName}`;
}
