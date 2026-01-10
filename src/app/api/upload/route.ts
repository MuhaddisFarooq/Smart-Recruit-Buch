import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const data = await req.formData();
        const file: File | null = data.get("file") as unknown as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), "public/uploads/attachments");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        // Generate unique filename
        const uniqueName = `${Date.now()}_${uuidv4().substring(0, 8)}_${file.name.replace(/\s+/g, '_')}`;
        const path = join(uploadDir, uniqueName);

        await writeFile(path, buffer);

        const url = `/uploads/attachments/${uniqueName}`;

        return NextResponse.json({
            success: true,
            url,
            name: file.name
        });

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
