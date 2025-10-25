// src/app/api/_helpers/image-processing.ts
import path from "path";
import { promises as fs } from "fs";

// Helper function to sanitize filenames
function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

/**
 * Save an uploaded image file with proper format preservation.
 * - PNG files maintain transparency and are saved as PNG
 * - Other formats are converted to JPEG for compression
 * - Preserves original resolution by default for better quality
 * 
 * @param file - The uploaded file
 * @param subfolder - Folder name within /uploads/ (e.g., 'users', 'sliders')
 * @param maxSide - Maximum width/height in pixels (default: null = no resize)
 * @param jpegQuality - JPEG quality 1-100 (default: 95 for high quality)
 * @returns Relative path like "users/filename.png" or "users/filename.jpg"
 */
export async function saveOptimizedImage(
  file: File,
  subfolder: string,
  maxSide: number | null = null,
  jpegQuality = 95
): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads", subfolder);
  
  // Ensure directory exists
  await fs.mkdir(uploadsDir, { recursive: true });

  // Determine if this is a PNG file (preserve transparency)
  const isPNG = file.type === "image/png" || file.name?.toLowerCase().endsWith('.png');
  
  // Generate filename with correct extension
  const baseName = sanitize(file.name || "image");
  const nameWithoutExt = baseName.replace(/\.[^.]+$/, "");
  const extension = isPNG ? ".png" : ".jpg";
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 8);
  const filename = `${timestamp}_${randomId}_${nameWithoutExt}${extension}`;
  const filePath = path.join(uploadsDir, filename);

  // Try to use Sharp for processing, fallback to direct save
  try {
    const sharp = (await import("sharp")).default;
    
    let processor = sharp(buf, { failOnError: false }).rotate();
    
    // Resize only if maxSide is specified and image is larger
    if (maxSide) {
      const metadata = await processor.metadata();
      if (metadata.width && metadata.height) {
        const currentMax = Math.max(metadata.width, metadata.height);
        if (currentMax > maxSide) {
          processor = processor.resize({
            width: metadata.width >= metadata.height ? maxSide : undefined,
            height: metadata.height > metadata.width ? maxSide : undefined,
            fit: "inside",
            withoutEnlargement: true,
          });
        }
      }
    }

    // Apply format-specific compression with high quality
    if (isPNG) {
      // Preserve PNG transparency with minimal compression
      await processor
        .png({ 
          quality: Math.min(100, Math.max(80, jpegQuality)), 
          compressionLevel: 6, // Less aggressive compression (0-9, 9=max compression)
          progressive: false    // Better for quality
        })
        .toFile(filePath);
    } else {
      // Convert other formats to high-quality JPEG
      await processor
        .jpeg({ 
          quality: jpegQuality, 
          progressive: true, 
          mozjpeg: true 
        })
        .toFile(filePath);
    }
  } catch (error) {
    // Fallback: save original file if Sharp fails
    console.warn("Sharp processing failed, saving original:", error);
    await fs.writeFile(filePath, buf);
  }

  // Return relative path for database storage
  return `${subfolder}/${filename}`;
}

/**
 * Delete an old image file from uploads directory
 * @param relativePath - Path like "users/old_image.jpg"
 */
export async function deleteImage(relativePath: string | null | undefined): Promise<void> {
  if (!relativePath) return;
  
  try {
    const absolutePath = path.join(process.cwd(), "public", "uploads", relativePath);
    await fs.unlink(absolutePath);
  } catch (error) {
    // Ignore errors (file might not exist)
    console.warn("Failed to delete image:", relativePath, error);
  }
}