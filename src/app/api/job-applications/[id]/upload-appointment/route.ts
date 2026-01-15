
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
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `signed_appointment_${id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadDir = path.join(process.cwd(), "public/uploads/appointments");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        const fileUrl = `/uploads/appointments/${fileName}`;

        // Update signed_appointment_letter_url
        try {
            await execute(
                "UPDATE job_applications SET signed_appointment_letter_url = ? WHERE id = ?",
                [fileUrl, id]
            );
        } catch (dbError: any) {
            // Lazy migration: Add column if missing
            if (dbError.code === 'ER_BAD_FIELD_ERROR') {
                console.log("Adding signed_appointment_letter_url column...");
                await execute("ALTER TABLE job_applications ADD COLUMN signed_appointment_letter_url VARCHAR(255) NULL");

                // Retry
                await execute(
                    "UPDATE job_applications SET signed_appointment_letter_url = ? WHERE id = ?",
                    [fileUrl, id]
                );
            } else {
                throw dbError;
            }
        }

        // Notify Admins/HR
        const adminUsers = await query("SELECT id FROM users WHERE role IN ('admin', 'hr', 'super_admin') LIMIT 1");
        if (Array.isArray(adminUsers) && adminUsers.length > 0) {
            const adminId = (adminUsers[0] as any).id;
            await execute(
                `INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, 'info', 'Signed Appointment Uploaded', ?, ?)`,
                [adminId, `A signed appointment letter has been uploaded for application #${id}.`, JSON.stringify({ application_id: id })]
            );
        }

        return NextResponse.json({ success: true, url: fileUrl });

    } catch (error: any) {
        console.error("Upload signed appointment error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
