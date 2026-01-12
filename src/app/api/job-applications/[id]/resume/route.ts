
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from 'uuid';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const formData = await req.formData();
        const file: File | null = formData.get("file") as unknown as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), "public/uploads/resumes");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        // Generate unique filename
        const uniqueName = `${Date.now()}_${uuidv4().substring(0, 8)}_${file.name.replace(/\s+/g, '_')}`;
        const path = join(uploadDir, uniqueName);

        // Save file
        await writeFile(path, buffer);

        const url = `/uploads/resumes/${uniqueName}`;

        // Update database
        await execute(
            "UPDATE job_applications SET resume_url = ?, resume_path = ? WHERE id = ?",
            [url, path, id]
        );

        return NextResponse.json({ success: true, url, message: "Resume updated successfully" });

    } catch (error: any) {
        console.error("Error uploading resume:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
