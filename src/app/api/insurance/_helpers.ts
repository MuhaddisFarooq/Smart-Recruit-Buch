// src/app/api/insurance/_helpers.ts
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { saveOptimizedImage } from "../_helpers/image-processing";

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
  
  // Use the new optimized image function with high quality and no resizing
  return await saveOptimizedImage(file, `insurance/${subfolder}`, null, 98);
}
