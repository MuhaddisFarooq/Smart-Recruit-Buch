import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";

export async function GET() {
    try {
        // Add avatar_url column to users table if it doesn't exist
        try {
            await execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL");
            return NextResponse.json({ message: "Added avatar_url column" });
        } catch (error: any) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                return NextResponse.json({ message: "avatar_url column already exists" });
            }
            throw error;
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
