import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, otp, password } = body;

        if (!email || !otp || !password) {
            return NextResponse.json({ error: "Email, OTP, and Password are required" }, { status: 400 });
        }

        // Find user by email
        const users = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);

        if (!Array.isArray(users) || users.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = users[0];

        // Check if already active
        if (user.status === 'Active') {
            return NextResponse.json({ error: "User is already active. Please login." }, { status: 400 });
        }

        // Validate OTP
        if (user.verification_code !== otp) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
        }

        // Validate Expiry
        if (new Date(user.verification_expires) < new Date()) {
            return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update User
        // Set password, status=Active, clear OTP
        await execute(
            `UPDATE users SET 
                password = ?, 
                status = 'Active', 
                verification_code = NULL, 
                verification_expires = NULL 
            WHERE id = ?`,
            [hashedPassword, user.id]
        );

        return NextResponse.json({ success: true, message: "Registration verified and completed" });

    } catch (error: any) {
        console.error("Complete Register Error:", error);
        return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
    }
}
