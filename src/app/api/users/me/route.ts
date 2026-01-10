import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query, execute } from "@/lib/db";

// GET /api/users/me - Get current user's profile
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = session.user.email;
        const rows = await query(
            `SELECT id, email, name, first_name, last_name, position, show_profile_on_jobs,
             street_address, city, country, zip_code, work_phone_code, work_phone,
             cell_phone_code, cell_phone, avatar_url,
             linkedin_url, facebook_url, twitter_url, website_url, bio,
             notifications_email, notifications_sms, role, department, designation, is_active
             FROM users WHERE email = ?`,
            [email]
        );

        if (Array.isArray(rows) && rows.length > 0) {
            return NextResponse.json(rows[0]);
        }

        return NextResponse.json({ error: "User not found" }, { status: 404 });
    } catch (error: any) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/users/me - Update current user's profile
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = session.user.email;
        const body = await req.json();
        const {
            first_name,
            last_name,
            position,
            show_profile_on_jobs,
            street_address,
            city,
            country,
            zip_code,
            work_phone_code,
            work_phone,
            cell_phone_code,
            cell_phone,
            avatar_url,
            linkedin_url,
            facebook_url,
            twitter_url,
            website_url,
            bio,
            notifications_email,
            notifications_sms,
        } = body;

        // Update name field as well (combination of first_name and last_name)
        const name = [first_name, last_name].filter(Boolean).join(" ") || null;

        await execute(
            `UPDATE users SET 
                name = ?,
                first_name = ?,
                last_name = ?,
                position = ?,
                show_profile_on_jobs = ?,
                street_address = ?,
                city = ?,
                country = ?,
                zip_code = ?,
                work_phone_code = ?,
                work_phone = ?,
                cell_phone_code = ?,
                cell_phone = ?,
                avatar_url = ?,
                linkedin_url = ?,
                facebook_url = ?,
                twitter_url = ?,
                website_url = ?,
                bio = ?,
                notifications_email = ?,
                notifications_sms = ?
             WHERE email = ?`,
            [
                name,
                first_name || null,
                last_name || null,
                position || null,
                show_profile_on_jobs ? 1 : 0,
                street_address || null,
                city || null,
                country || null,
                zip_code || null,
                work_phone_code || null,
                work_phone || null,
                cell_phone_code || null,
                cell_phone || null,
                avatar_url || null,
                linkedin_url || null,
                facebook_url || null,
                twitter_url || null,
                website_url || null,
                bio || null,
                notifications_email ? 1 : 0,
                notifications_sms ? 1 : 0,
                email,
            ]
        );

        return NextResponse.json({ success: true, message: "Profile updated successfully" });
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/users/me - Deactivate/Delete current user's account
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = session.user.email;

        // Delete the user from the database
        await execute(`DELETE FROM users WHERE email = ?`, [email]);

        return NextResponse.json({ success: true, message: "Account deactivated successfully" });
    } catch (error: any) {
        console.error("Error deactivating account:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
