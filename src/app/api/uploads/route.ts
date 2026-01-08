// src/app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

const ALLOWED_FOLDERS = new Set(["consultants", "categories", "careers", "misc", "resumes"]);

/** Try to compress an image buffer using sharp if available. */
async function maybeCompressImage(
  buffer: Buffer,
  mime: string
): Promise<{ out: Buffer; ext: string }> {
  if (!mime || !mime.startsWith("image/")) {
    // Not an image: keep original bytes and extension unknown
    return { out: buffer, ext: path.extname("bin") || ".bin" };
  }

  // Lazy import sharp — route still works if sharp isn't installed
  let sharpMod: any;
  try {
    sharpMod = (await import("sharp")).default;
  } catch {
    return { out: buffer, ext: path.extname("jpg") || ".jpg" };
  }

  try {
    const sharp = sharpMod(buffer, { failOnError: false });
    const meta = await sharp.metadata().catch(() => ({} as any));

    // High quality settings - no resizing by default
    let maxSide = 999999;            // effectively no limit for high quality
    let quality = 98;                // high-quality 98% for better preservation
    const targetBytes = 10 * 1024 * 1024;  // ~10MB target (much larger for quality)

    // Check if this is a PNG image to preserve transparency
    const isPNG = mime === "image/png" || meta?.format === "png";

    const makePipeline = () => {
      let pipe = sharpMod(buffer, { failOnError: false });
      // Don't resize unless file is enormous (> 999999px)
      if (meta?.width && meta?.height) {
        const w = meta.width!;
        const h = meta.height!;
        if (Math.max(w, h) > maxSide) {
          pipe = pipe.resize({
            width: w >= h ? maxSide : undefined,
            height: h > w ? maxSide : undefined,
            fit: "inside",
            withoutEnlargement: true,
          });
        }
      }

      // Use PNG format for PNG images to preserve transparency, JPEG for others
      if (isPNG) {
        return pipe.png({
          quality: Math.round(quality),
          compressionLevel: 6, // Less aggressive compression for quality
          progressive: false   // Better for quality 
        });
      } else {
        return pipe.jpeg({ quality, mozjpeg: true });
      }
    };

    let out: Buffer = await makePipeline().toBuffer();

    // Only compress if file is still very large (over 10MB)
    let attempts = 0;
    while (out.byteLength > targetBytes && attempts < 3) {
      if (quality > 80) quality -= 5;  // Less aggressive quality reduction
      else break;  // Stop early to preserve quality

      out = await makePipeline().toBuffer();
      attempts++;
    }

    return { out, ext: isPNG ? ".png" : ".jpg" };
  } catch {
    return { out: buffer, ext: ".jpg" };
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const folderParam = (url.searchParams.get("folder") || "").toLowerCase();
    const folder = ALLOWED_FOLDERS.has(folderParam) ? folderParam : "consultants";

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // Read uploaded bytes
    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer as ArrayBuffer);

    // Compress to KB if possible
    const mime = (file as any).type || "";
    const { out, ext } = await maybeCompressImage(buffer, mime);
    buffer = out;

    // Ensure destination exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Build filename
    const original = sanitizeName((file as any).name || "image.jpg");
    const base = path.basename(original, path.extname(original));
    const fname = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${base}${ext || path.extname(original) || ".jpg"}`;
    const abs = path.join(uploadsDir, fname);

    // Save
    await fs.writeFile(abs, buffer);

    // For DB storage & public URL
    const stored = `${folder}/${fname}`;
    const publicUrl = `/uploads/${stored}`;

    // Keep both keys for compatibility
    return NextResponse.json({ ok: true, filename: stored, fileName: stored, url: publicUrl });
  } catch (err: any) {
    console.error("[uploads:POST] error:", err);
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
