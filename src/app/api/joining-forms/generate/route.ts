
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
        const type = (formData.get("type") as string) || "joining"; // Default to joining
        const data = JSON.parse(dataStr);

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID required" }, { status: 400 });
        }

        // Determine Template and Column based on Type
        let templateName = "Joining_Form.docx";
        let dbColumn = "joining_form_url";
        let outputFolder = "joining_forms";

        if (type === "hostel") {
            templateName = "BIH-Hostel.docx";
            dbColumn = "hostel_form_url";
            outputFolder = "hostel_forms";
        } else if (type === "transport") {
            templateName = "BIH-Transport.docx";
            dbColumn = "transport_form_url";
            outputFolder = "transport_forms";
        }

        // Load Template
        const templatePath = path.join(process.cwd(), "public/letters", templateName);

        if (!fs.existsSync(templatePath)) {
            return NextResponse.json({ error: `Template ${templateName} not found` }, { status: 404 });
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
            FullName: data.name, // Common in some forms

            id: data.employee_id,
            ID: data.employee_id,
            employee_id: data.employee_id,
            EmployeeID: data.employee_id,

            cnic: data.cnic,
            CNIC: data.cnic,

            designation: data.designation,
            Designation: data.designation,
            PositionTitle: data.designation, // For Transport/Hostel if needed

            department: data.department,
            Department: data.department,

            joining_date: formattedDate,
            JoiningDate: formattedDate,
            DateofJoining: formattedDate,

            contact_no: data.contact_no,
            ContactNo: data.contact_no,

            hometown: data.hometown,
            Hometown: data.hometown,
            City: data.hometown,
        });

        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        // Save Generated File
        const fileName = `${type}_form_${applicationId}_${Date.now()}.docx`;
        const uploadDir = path.join(process.cwd(), "public/uploads", outputFolder);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buf);
        const fileUrl = `/uploads/${outputFolder}/${fileName}`;

        // Update Database with dynamic column
        try {
            await execute(
                `UPDATE job_applications SET ${dbColumn} = ? WHERE id = ?`,
                [fileUrl, applicationId]
            );
        } catch (dbError: any) {
            // Lazy migration: If column doesn't exist, add it
            if (dbError.code === 'ER_BAD_FIELD_ERROR') {
                console.log(`Adding ${dbColumn} column...`);
                await execute(`ALTER TABLE job_applications ADD COLUMN ${dbColumn} VARCHAR(255) NULL`);

                // Retry update
                await execute(
                    `UPDATE job_applications SET ${dbColumn} = ? WHERE id = ?`,
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
