import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rows = await query("SELECT * FROM users WHERE id = ?", [id]);

        if (!rows || (rows as any[]).length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json((rows as any[])[0]);
    } catch (error: any) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const updatedBy = session.user?.name || session.user?.email || "Unknown";

        const body = await req.json();
        const {
            employee_id,
            name,
            department,
            designation,
            email,
            password,
            role,
            status,
            picture,
            cnic,
            phone,
            joining_date
        } = body;

        // Check if user exists
        const existing = await query("SELECT id, password FROM users WHERE id = ?", [id]);
        if (!existing || (existing as any[]).length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let finalPassword = (existing as any[])[0].password;
        if (password && password.trim() !== "") {
            finalPassword = await bcrypt.hash(password, 10);
        }

        await execute(
            `UPDATE users SET 
        employee_id=?, name=?, department=?, designation=?, email=?, 
        password=?, role=?, status=?, picture=?, cnic=?, phone=?, joining_date=?, updatedBy=?, updatedDate=NOW()
       WHERE id=?`,
            [
                employee_id || null,
                name,
                department || null,
                designation || null,
                email,
                finalPassword,
                role,
                status,
                picture || null,
                cnic || null,
                phone || null,
                joining_date || null,
                updatedBy,
                id
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Prevent deleting yourself? optional check.

        await execute("DELETE FROM users WHERE id=?", [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
