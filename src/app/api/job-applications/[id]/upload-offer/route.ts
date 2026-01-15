
import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import fs from "fs";
import path from "path";

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
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `signed_offer_${id}_${Date.now()}_${file.name}`;
        const uploadDir = path.join(process.cwd(), "public/uploads/offers");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        const fileUrl = `/uploads/offers/${fileName}`;

        // Update signed_offer_letter_url
        try {
            await execute(
                "UPDATE job_applications SET signed_offer_letter_url = ? WHERE id = ?",
                [fileUrl, id]
            );
        } catch (dbError: any) {
            // Lazy migration: Add column if missing
            if (dbError.code === 'ER_BAD_FIELD_ERROR') {
                console.log("Adding signed_offer_letter_url column...");
                await execute("ALTER TABLE job_applications ADD COLUMN signed_offer_letter_url VARCHAR(255) NULL");

                // Retry
                await execute(
                    "UPDATE job_applications SET signed_offer_letter_url = ? WHERE id = ?",
                    [fileUrl, id]
                );
            } else {
                throw dbError;
            }
        }

        // Notify Admin (optional, notifying user ID 1 for now or hardcoded HR)
        // Ideally should notify the job owner.
        const app = await query("SELECT job_id FROM job_applications WHERE id = ?", [id]);
        // Placeholder notification to generic admin/HR would go here

        return NextResponse.json({ success: true, url: fileUrl });

    } catch (error: any) {
        console.error("Upload signed offer error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
