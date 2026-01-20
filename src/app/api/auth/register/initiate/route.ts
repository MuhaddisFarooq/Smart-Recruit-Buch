import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { sendEmail, getOTPEmailTemplate } from "@/lib/email";

export const dynamic = 'force-dynamic';

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, name, cnic, phone } = body;

        if (!email || !name || !cnic || !phone) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // Check if user already exists
        const existing = await query("SELECT id, status FROM users WHERE email = ? LIMIT 1", [email]);

        if (Array.isArray(existing) && existing.length > 0) {
            const user = existing[0];
            if (user.status === 'Active') {
                return NextResponse.json({ error: "Email already exists. Please login." }, { status: 409 });
            }

            // If user exists but is not active (Unverified), we resend OTP
            // Update the existing unverified record
            const otp = generateOTP();
            const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            await execute(
                `UPDATE users SET 
                    verification_code = ?, 
                    verification_expires = ?, 
                    name = ?, 
                    cnic = ?, 
                    phone = ? 
                WHERE id = ?`,
                [otp, expires, name, cnic, phone, user.id]
            );

            await sendEmail(email, "Your Verification Code", getOTPEmailTemplate(otp));
            return NextResponse.json({ success: true, message: "OTP sent to email" });
        }

        // Require new user creation
        const otp = generateOTP();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Default role 'candidate', status 'Unverified'
        await execute(
            `INSERT INTO users (
                email, role, status, name, cnic, phone, addedDate, addedBy, verification_code, verification_expires
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
            [
                email,
                "candidate",
                "Unverified",
                name,
                cnic,
                phone,
                "system",
                otp,
                expires
            ]
        );

        await sendEmail(email, "Your Verification Code", getOTPEmailTemplate(otp));

        return NextResponse.json({ success: true, message: "OTP sent to email" }, { status: 201 });

    } catch (error: any) {
        console.error("Initiate Register Error:", error);
        return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
    }
}
