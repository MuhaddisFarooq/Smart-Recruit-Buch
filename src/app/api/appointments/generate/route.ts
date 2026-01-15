
import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
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
        const templatePath = path.join(process.cwd(), "public/letters", "Appointment_Letter.docx");

        if (!fs.existsSync(templatePath)) {
            return NextResponse.json({ error: "Template Appointment_Letter.docx not found" }, { status: 404 });
        }

        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Render Tokens
        doc.render({
            name: data.name,
            EmployeeName: data.name,
            Employee_Name: data.name,

            designation: data.designation,
            Designation: data.designation,

            department: data.department,
            Department: data.department,

            salary: data.salary,
            Monthly_Salary: data.salary,
            MonthlySalary: data.salary,

            employment_type: data.employment_type,
            Employment_Type: data.employment_type,
            EmploymentType: data.employment_type,

            joining_date: data.joining_date,
            Joining_Date: data.joining_date,
            Date_of_Joining: data.joining_date,

            date: new Date().toLocaleDateString('en-GB'),
            Date: new Date().toLocaleDateString('en-GB'),
        });

        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        // Save Generated File
        const fileName = `appointment_${applicationId}_${Date.now()}.docx`;
        const uploadDir = path.join(process.cwd(), "public/uploads/appointments");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buf);
        const fileUrl = `/uploads/appointments/${fileName}`;

        // Update Database with appointment_letter_url
        try {
            await execute(
                "UPDATE job_applications SET appointment_letter_url = ? WHERE id = ?",
                [fileUrl, applicationId]
            );
        } catch (dbError: any) {
            // Lazy migration: If column doesn't exist, add it
            if (dbError.code === 'ER_BAD_FIELD_ERROR') {
                console.log("Adding appointment_letter_url column...");
                await execute("ALTER TABLE job_applications ADD COLUMN appointment_letter_url VARCHAR(255) NULL");

                // Retry update
                await execute(
                    "UPDATE job_applications SET appointment_letter_url = ? WHERE id = ?",
                    [fileUrl, applicationId]
                );
            } else {
                throw dbError;
            }
        }

        // Fetch user info for notification
        const appDetails = await query(`
            SELECT u.id as user_id, u.name, j.job_title 
            FROM job_applications ja
            JOIN users u ON ja.user_id = u.id
            JOIN jobs j ON ja.job_id = j.id
            WHERE ja.id = ?
        `, [applicationId]);

        if (appDetails.length > 0) {
            const { user_id, name, job_title } = appDetails[0];

            // Notify Candidate
            await execute(
                `INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, 'info', 'Appointment Letter Issued', ?, ?)`,
                [user_id, `Your appointment letter for ${job_title} is ready.`, JSON.stringify({ application_id: applicationId, status: 'hired' })]
            );
        }

        return NextResponse.json({ success: true, url: fileUrl });

    } catch (error: any) {
        console.error("Appointment generation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
