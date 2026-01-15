
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

        // TODO: Add stricter role checks if needed (Admin/HR only)

        const formData = await req.formData();
        const applicationId = formData.get("applicationId") as string;
        const mode = formData.get("mode") as string; // 'generate' or 'upload'

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID required" }, { status: 400 });
        }

        let offerUrl = "";
        let offeredSalary = "";

        if (mode === "upload") {
            const file = formData.get("file") as File;
            if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

            // Save Custom File
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const fileName = `offer_${applicationId}_${Date.now()}_custom.docx`; // Or keep original extension
            const uploadDir = path.join(process.cwd(), "public/uploads/offers");

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            offerUrl = `/uploads/offers/${fileName}`;

        } else if (mode === "generate") {
            const templateName = formData.get("template") as string; // 'Locum' or 'Full Time'
            const dataStr = formData.get("data") as string;
            const data = JSON.parse(dataStr);
            offeredSalary = data.salary;

            // Load Template
            const templateFileName = templateName === "Locum" ? "Offer_Letter_Locum.docx" : "Offer_Letter_Full Time.docx";
            const templatePath = path.join(process.cwd(), "public/letters", templateFileName);

            if (!fs.existsSync(templatePath)) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }

            const content = fs.readFileSync(templatePath, "binary");
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            // Render
            doc.render({
                name: data.name,
                cnic: data.cnic,
                job_title: data.job_title,
                department: data.department,
                salary: data.salary,
                // Aliases for compatibility with different templates
                fullname: data.name,
                FullName: data.name,
                FULLNAME: data.name,
                Name: data.name,
                NAME: data.name,

                designation: data.job_title,
                Designation: data.job_title,
                DESIGNATION: data.job_title,

                position: data.job_title,
                Position: data.job_title,
                POSITION: data.job_title,

                job_title_upper: data.job_title,
                Job_Title: data.job_title,
                JOB_TITLE: data.job_title,

                cnic_no: data.cnic,
                Cnic: data.cnic,
                CNIC: data.cnic,

                department_upper: data.department,
                Department: data.department,
                DEPARTMENT: data.department,

                monthly_salary: data.salary,
                Monthly_Salary: data.salary,
                Salary: data.salary,
                SALARY: data.salary, // In case template uses upper case

                date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
                Date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
                DATE: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
                ...data // Spread other fields if any
            });

            const buf = doc.getZip().generate({
                type: "nodebuffer",
                compression: "DEFLATE",
            });

            // Save Generated File
            const fileName = `offer_${applicationId}_${Date.now()}.docx`;
            const uploadDir = path.join(process.cwd(), "public/uploads/offers");

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buf);
            offerUrl = `/uploads/offers/${fileName}`;
        }

        // Update Database
        // Update Database with offered salary
        try {
            await execute(
                "UPDATE job_applications SET status = 'offered', offer_letter_url = ?, offered_salary = ? WHERE id = ?",
                [offerUrl, offeredSalary, applicationId]
            );
        } catch (dbError: any) {
            // Lazy migration: If column doesn't exist, add it
            if (dbError.code === 'ER_BAD_FIELD_ERROR') {
                console.log("Adding offered_salary column...");
                await execute("ALTER TABLE job_applications ADD COLUMN offered_salary VARCHAR(255) NULL AFTER score");

                // Retry update
                await execute(
                    "UPDATE job_applications SET status = 'offered', offer_letter_url = ?, offered_salary = ? WHERE id = ?",
                    [offerUrl, offeredSalary, applicationId]
                );
            } else {
                throw dbError;
            }
        }

        // Fetch user and job info for notification
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
                `INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, 'info', 'Offer Received', ?, ?)`,
                [user_id, `You have received an offer for ${job_title}. Please check your application dashboard.`, JSON.stringify({ application_id: applicationId, status: 'offered' })]
            );
        }

        return NextResponse.json({ success: true, url: offerUrl });

    } catch (error: any) {
        console.error("Values error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
