import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

// GET /api/departments/employees - Get employees from a department via external API
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userAccess = (session.user as any).access?.toLowerCase() || "candidate";
        const userRole = (session.user as any).role?.toLowerCase() || "candidate";

        // Only HOD, Admin, HR can access this
        if (!["superadmin", "admin", "hr", "hod"].includes(userAccess) &&
            !["admin", "hr", "hod"].includes(userRole)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        let department = searchParams.get("department");

        // If HOD, force their own department
        if (userAccess === "hod" || userRole === "hod") {
            department = (session.user as any).department || department;
        }

        if (!department) {
            return NextResponse.json({ error: "Department is required" }, { status: 400 });
        }

        // First, get department ID from our departments API
        const deptRes = await fetch("https://buchhospital.com/ppapi/emp_department.php", {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            }
        });

        if (!deptRes.ok) {
            return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
        }

        const deptData = await deptRes.json();

        // Find the department
        const targetDept = deptData.data?.find((d: any) =>
            d.dept?.toLowerCase() === department?.toLowerCase() ||
            d.id === department
        );

        if (!targetDept) {
            return NextResponse.json({ error: "Department not found" }, { status: 404 });
        }

        // Fetch all employees from external API
        // We'll need to fetch employees by department
        // The emp_info.php endpoint requires a PIN, so we'll use emp_department.php which has department info

        // For now, we'll fetch individual employee info using known employee IDs
        // In a real scenario, there would be an API to list all employees by department

        // Let's try fetching from a department employees endpoint if available
        // If not, we'll need to have a different approach

        // Try fetching employees by department
        const empRes = await fetch(`https://buchhospital.com/ppapi/emp_by_dept.php?department=${encodeURIComponent(targetDept.dept)}`, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            }
        });

        if (empRes.ok) {
            const empData = await empRes.json();
            if (empData.status === 200 && empData.data) {
                // Filter out HOD (they're already added automatically)
                const employees = empData.data.filter((emp: any) => emp.emp_id !== targetDept.hod);
                return NextResponse.json({
                    department: targetDept.dept,
                    hod_id: targetDept.hod,
                    employees: employees.map((emp: any) => ({
                        emp_id: emp.emp_id,
                        name: emp.name,
                        email: emp.email,
                        department: emp.department,
                        role: emp.role || "user"
                    }))
                });
            }
        }

        // Fallback: Return empty list if no employee API available
        return NextResponse.json({
            department: targetDept.dept,
            hod_id: targetDept.hod,
            employees: [],
            message: "Employee listing API not available. Please search by name instead."
        });

    } catch (error: any) {
        console.error("Error fetching department employees:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
