
import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options"; // Assuming authOptions are exported from here or wherever they are

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("user_id");
    let currentUserId = (session.user as any).id;

    if (!currentUserId && session.user.email) {
        console.log("ID not found in session, fetching by email:", session.user.email);
        const [u] = await query("SELECT id FROM users WHERE email = ?", [session.user.email]);
        if (u) currentUserId = u.id;
    }

    if (!currentUserId) {
        return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    console.log("Messages API: Final Current User ID:", currentUserId);

    try {
        if (targetUserId) {
            // Fetch conversation with specific user
            const messages = await query(
                `SELECT m.*, 
                        u.name as sender_name, u.avatar_url as sender_avatar,
                        r.name as receiver_name, r.avatar_url as receiver_avatar
                 FROM messages m
                 JOIN users u ON m.sender_id = u.id
                 JOIN users r ON m.receiver_id = r.id
                 WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                    OR (m.sender_id = ? AND m.receiver_id = ?)
                 ORDER BY m.created_at ASC`,
                [currentUserId, targetUserId, targetUserId, currentUserId]
            );
            return NextResponse.json(messages);
        } else {
            console.log("Fetching conversation list for:", currentUserId);

            const conversations = await query(
                `SELECT 
                    CASE 
                        WHEN m.sender_id = ? THEN m.receiver_id 
                        ELSE m.sender_id 
                    END as other_user_id,
                    MAX(m.created_at) as last_message_at
                 FROM messages m
                 WHERE m.sender_id = ? OR m.receiver_id = ?
                 GROUP BY 1
                 ORDER BY last_message_at DESC`,
                [currentUserId, currentUserId, currentUserId]
            );

            console.log("Raw conversations found:", JSON.stringify(conversations, null, 2));

            // Now fetch user details for these IDs
            const conversationDetails = [];
            for (const conv of conversations) {
                console.log("Processing conversation with:", conv.other_user_id);
                const [user] = await query("SELECT id, name, avatar_url, role FROM users WHERE id = ?", [conv.other_user_id]);

                if (!user) {
                    console.log("User not found for ID:", conv.other_user_id);
                    continue;
                }

                // Get last message text
                const [lastMsg] = await query(
                    "SELECT message, is_read, sender_id FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1",
                    [currentUserId, conv.other_user_id, conv.other_user_id, currentUserId]
                );

                if (user) {
                    conversationDetails.push({
                        user,
                        lastMessage: lastMsg
                    });
                }
            }

            console.log("Comparison details returning:", conversationDetails.length);
            return NextResponse.json(conversationDetails);
        }
    } catch (error: any) {
        console.error("Messages API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { receiver_id, message, job_id } = body;
        const sender_id = (session.user as any).id;

        if (!receiver_id || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await execute(
            "INSERT INTO messages (sender_id, receiver_id, message, job_id) VALUES (?, ?, ?, ?)",
            [sender_id, receiver_id, message, job_id || null]
        );

        return NextResponse.json({ success: true, id: result.insertId });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
