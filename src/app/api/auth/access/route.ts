import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/access
 * Returns the current user's access level and permissions for frontend use
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                authenticated: false,
                access: 'guest',
                role: 'guest',
                canEdit: false,
                canDelete: false,
                canCreate: false,
                department: null
            });
        }

        const user = session.user as any;
        const access = (user.access || 'candidate').toLowerCase();
        const role = (user.role || 'candidate').toLowerCase();

        // Determine permissions based on access level
        let canEdit = false;
        let canDelete = false;
        let canCreate = false;

        if (access === 'superadmin' || role === 'admin') {
            // Superadmin has full access
            canEdit = true;
            canDelete = true;
            canCreate = true;
        } else if (access === 'hr') {
            // HR can create and edit, but not delete/cancel
            canEdit = true;
            canDelete = false;
            canCreate = true;
        } else if (access === 'hod' || role === 'hod') {
            // HOD can manage their department's jobs
            canEdit = true;
            canDelete = true;
            canCreate = true;
        }
        // Candidates have no admin permissions

        return NextResponse.json({
            authenticated: true,
            access: access,
            role: role,
            canEdit,
            canDelete,
            canCreate,
            department: user.department || null,
            emp_id: user.emp_id || null,
            name: user.name || null,
            email: user.email || null
        });

    } catch (error: any) {
        console.error("Access API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
