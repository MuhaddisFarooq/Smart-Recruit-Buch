
import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const applicationId = formData.get("applicationId") as string;
        const dataStr = formData.get("data") as string;
        const data = JSON.parse(dataStr);

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID required" }, { status: 400 });
        }

        // Load Template
        const templatePath = path.join(process.cwd(), "public/letters", "Joining_Form.docx");

        if (!fs.existsSync(templatePath)) {
            return NextResponse.json({ error: "Template Joining_Form.docx not found" }, { status: 404 });
        }

        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Format Date to DD-MM-YYYY or DD-Mon-YYYY
        const dateObj = new Date(data.joining_date);
        const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

        // Render Tokens
        doc.render({
            name: data.name,
            EmployeeName: data.name,

            id: data.employee_id,
            ID: data.employee_id,
            employee_id: data.employee_id,

            cnic: data.cnic,
            CNIC: data.cnic,

            designation: data.designation,
            Designation: data.designation,

            department: data.department,
            Department: data.department,

            joining_date: formattedDate,
            JoiningDate: formattedDate,
            DateofJoining: formattedDate,

            contact_no: data.contact_no,
            ContactNo: data.contact_no,
        });

        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        // Save Generated File
        const fileName = `joining_form_${applicationId}_${Date.now()}.docx`;
        const uploadDir = path.join(process.cwd(), "public/uploads/joining_forms");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buf);
        const fileUrl = `/uploads/joining_forms/${fileName}`;

        // Update Database with joining_form_url
        try {
            await execute(
                "UPDATE job_applications SET joining_form_url = ? WHERE id = ?",
                [fileUrl, applicationId]
            );
        } catch (dbError: any) {
            // Lazy migration: If column doesn't exist, add it
            if (dbError.code === 'ER_BAD_FIELD_ERROR') {
                console.log("Adding joining_form_url column...");
                await execute("ALTER TABLE job_applications ADD COLUMN joining_form_url VARCHAR(255) NULL");

                // Retry update
                await execute(
                    "UPDATE job_applications SET joining_form_url = ? WHERE id = ?",
                    [fileUrl, applicationId]
                );
            } else {
                throw dbError;
            }
        }

        return NextResponse.json({ success: true, url: fileUrl });

    } catch (error: any) {
        console.error("Joining form generation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
