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
        const rows = await query("SELECT * FROM users WHERE id = ?", [id]);
        if (!rows || (rows as any[]).length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const existingUser = (rows as any[])[0];

        let finalPassword = existingUser.password;
        if (password && password.trim() !== "") {
            finalPassword = await bcrypt.hash(password, 10);
        }

        await execute(
            `UPDATE users SET 
        employee_id=?, name=?, department=?, designation=?, email=?, 
        password=?, role=?, status=?, picture=?, cnic=?, phone=?, joining_date=?, updatedBy=?, updatedDate=NOW()
       WHERE id=?`,
            [
                employee_id !== undefined ? employee_id : existingUser.employee_id,
                name !== undefined ? name : existingUser.name,
                department !== undefined ? department : existingUser.department,
                designation !== undefined ? designation : existingUser.designation,
                email !== undefined ? email : existingUser.email,
                finalPassword,
                role !== undefined ? role : existingUser.role,
                status !== undefined ? status : existingUser.status,
                picture !== undefined ? picture : existingUser.picture,
                cnic !== undefined ? cnic : existingUser.cnic,
                phone !== undefined ? phone : existingUser.phone,
                joining_date !== undefined ? joining_date : existingUser.joining_date,
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
