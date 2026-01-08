import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // List all users. 
        // We select specifically to avoid sending password hashes if possible, 
        // but typically * fetches everything. Let's be explicit for safety or just * for now.
        // Ideally exclude password.
        const sql = `
      SELECT 
        id, employee_id, name, department, designation, email, role, status, picture, addedBy, addedDate 
      FROM users 
      ORDER BY id DESC
    `;

        // We might need to handle the case where 'users' table structure might differ slightly or if we need to join.
        // Based on seed-users.ts, relevant fields are there.
        const rows = await query(sql);

        return NextResponse.json(rows);
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const addedBy = session.user?.name || session.user?.email || "Unknown";

        const body = await req.json();
        const {
            employee_id,
            name,
            department,
            designation,
            email,
            password,
            role,
            status, // Optional, default 'active'
            picture
        } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check email uniqueness
        const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
        if (Array.isArray(existing) && existing.length > 0) {
            return NextResponse.json({ error: "Email already exists" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || "user";
        const userStatus = status || "Active";

        const result = await execute(
            `INSERT INTO users (
        employee_id, name, department, designation, email, password, picture, status, role, addedBy, addedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                employee_id || null,
                name,
                department || null,
                designation || null,
                email,
                hashedPassword,
                picture || null,
                userStatus,
                userRole,
                addedBy
            ]
        );

        return NextResponse.json({ success: true, id: (result as any).insertId });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
