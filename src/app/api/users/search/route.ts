import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
        return NextResponse.json([]);
    }

    try {
        // First search local database
        const localUsers = await query(`
            SELECT id, name, email, avatar_url, designation, emp_id
            FROM users 
            WHERE (name LIKE ? OR email LIKE ?) AND role != 'candidate'
            LIMIT 10
        `, [`%${q}%`, `%${q}%`]) as any[];

        // Check if user is superadmin - they can also search external API
        const session = await getServerSession(authOptions);
        const userAccess = (session?.user as any)?.access?.toLowerCase() || 'candidate';
        const userRole = (session?.user as any)?.role?.toLowerCase() || 'candidate';
        const isSuperadmin = userAccess === 'superadmin' || userRole === 'admin';

        if (isSuperadmin) {
            // Try to search external API for employees not in local DB
            try {
                // Fetch all departments
                const deptRes = await fetch("https://buchhospital.com/ppapi/emp_department.php", {
                    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
                });

                if (deptRes.ok) {
                    const deptData = await deptRes.json();
                    const departments = deptData.data || [];

                    // For each department, try to fetch employees
                    for (const dept of departments.slice(0, 5)) { // Limit to 5 depts for performance
                        try {
                            const empRes = await fetch(
                                `https://buchhospital.com/ppapi/emp_by_dept.php?department=${encodeURIComponent(dept.dept)}`,
                                { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }
                            );

                            if (empRes.ok) {
                                const empData = await empRes.json();
                                const employees = empData.data || [];

                                // Filter by search query
                                const matchingEmps = employees.filter((emp: any) =>
                                    emp.name?.toLowerCase().includes(q.toLowerCase()) ||
                                    emp.email?.toLowerCase().includes(q.toLowerCase())
                                );

                                // Add to results if not already in local users
                                for (const emp of matchingEmps) {
                                    const exists = localUsers.some(u => u.emp_id === emp.emp_id || u.email === emp.email);
                                    if (!exists && localUsers.length < 15) {
                                        localUsers.push({
                                            id: null, // Will be created when added to team
                                            name: emp.name,
                                            email: emp.email,
                                            emp_id: emp.emp_id,
                                            avatar_url: null,
                                            designation: emp.department,
                                            isExternal: true
                                        });
                                    }
                                }
                            }
                        } catch (e) {
                            // Continue with other departments
                        }
                    }
                }
            } catch (e) {
                console.error("External API search failed:", e);
            }
        }

        return NextResponse.json(localUsers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
