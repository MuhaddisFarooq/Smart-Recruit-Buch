import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export async function GET() {
    try {
        const users = await execute("DESCRIBE users");
        return NextResponse.json({ users });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
