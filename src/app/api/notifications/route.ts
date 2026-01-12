
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const session = await getServerSession(authOptions);
        console.log("Notification API Session:", JSON.stringify(session, null, 2));

        let userId: number;
        if (session && (session.user as any)?.id) {
            userId = parseInt((session.user as any).id);
        } else if (session?.user?.email) {
            // Fallback: If ID isn't in session, fetch it by email
            const users = await query("SELECT id FROM users WHERE email = ?", [session.user.email]);
            if (users.length > 0) {
                userId = users[0].id;
            } else {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
        } else {
            console.log("Session invalid or missing user ID/email:", session);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const limit = parseInt(searchParams.get("limit") || "10");

        const sql = `
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;

        const notifications = await query(sql, [userId, limit]);

        // Count unread
        const countSql = `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`;
        const countRes = await query(countSql, [userId]);
        const unreadCount = countRes[0]?.count || 0;

        return NextResponse.json({
            data: notifications,
            unread_count: unreadCount
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session.user as any)?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt((session.user as any).id);
        const body = await req.json();
        const { id, mark_all_read } = body;

        if (mark_all_read) {
            await execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
            return NextResponse.json({ message: "All notifications marked as read" });
        }

        if (id) {
            await execute("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [id, userId]);
            return NextResponse.json({ message: "Notification marked as read" });
        }

        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
