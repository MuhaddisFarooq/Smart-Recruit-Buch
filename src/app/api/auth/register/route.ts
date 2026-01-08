import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
        }

        // Check if user already exists
        const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
        if (Array.isArray(existing) && existing.length > 0) {
            return NextResponse.json({ error: "Email already exists" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Default role for self-registration is 'candidate'
        const role = "candidate";
        const status = "Active";

        await execute(
            `INSERT INTO users (
                email, password, role, status, name, addedDate, addedBy
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
            [
                email,
                hashedPassword,
                role,
                status,
                name, // Use provided name
                'system' // addedBy
            ]
        );

        return NextResponse.json({ success: true, message: "Registration successful" }, { status: 201 });

    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
    }
}
