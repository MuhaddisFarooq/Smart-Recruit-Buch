import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";

// GET /api/jobs/[id]/team - List team members
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        // 1. Fetch Job Department to check for HOD updates
        const jobRows = await query("SELECT department FROM jobs WHERE id = ?", [id]) as any[];
        if (jobRows.length > 0 && jobRows[0].department) {
            const department = jobRows[0].department;

            // 2. Fetch External HOD info for this department
            try {
                const deptRes = await fetch("https://buchhospital.com/ppapi/emp_department.php", { cache: 'no-store' });
                if (deptRes.ok) {
                    const deptData = await deptRes.json();
                    const targetDept = deptData.data?.find((d: any) =>
                        d.dept?.toLowerCase() === department.toLowerCase() || d.id == department
                    );

                    if (targetDept && targetDept.hod) {
                        const targetHodId = String(targetDept.hod);

                        // 3. Check current HOD in our team
                        const currentTeamHod = await query(
                            `SELECT u.id, u.emp_id FROM job_hiring_team t 
                             JOIN users u ON t.user_id = u.id 
                             WHERE t.job_id = ? AND t.role = 'HOD'`,
                            [id]
                        ) as any[];

                        const currentHodEmpId = currentTeamHod[0]?.emp_id ? String(currentTeamHod[0].emp_id) : null;

                        if (currentHodEmpId !== targetHodId) {
                            console.log(`Syncing HOD for Job ${id}. Old: ${currentHodEmpId}, New: ${targetHodId}`);

                            // 3a. Check if we already have this user locally (Best path)
                            let newHodUserId = null;
                            const existingUser = await query("SELECT id FROM users WHERE emp_id = ?", [targetHodId]) as any[];

                            if (existingUser.length > 0) {
                                newHodUserId = existingUser[0].id;
                                console.log(`HOD User found locally: ID ${newHodUserId}`);
                            } else {
                                // 3b. Not found locally, fetch details from emp_by_dept to create them
                                console.log("HOD User not local, fetching from API...");
                                const empRes = await fetch(`https://buchhospital.com/ppapi/emp_by_dept.php?department=${encodeURIComponent(department)}`, { cache: 'no-store' });
                                if (empRes.ok) {
                                    const empData = await empRes.json();
                                    const newHodDetails = empData.data?.find((e: any) => String(e.emp_id) === targetHodId);

                                    if (newHodDetails) {
                                        const ins = await execute(
                                            `INSERT INTO users (email, name, emp_id, department, role, status, addedDate, addedBy)
                                             VALUES (?, ?, ?, ?, 'hod', 'active', NOW(), 'System')`,
                                            [newHodDetails.email, newHodDetails.name, targetHodId, department]
                                        );
                                        newHodUserId = (ins as any).insertId;
                                    }
                                }
                            }

                            // 3c. Update Team Sync Logic
                            if (newHodUserId) {
                                console.log(`Updating Job ${id} team with HOD User ID ${newHodUserId}`);
                                // Check if they are already in the team
                                const inTeam = await query("SELECT role FROM job_hiring_team WHERE job_id = ? AND user_id = ?", [id, newHodUserId]) as any[];

                                if (inTeam.length > 0) {
                                    // Update their role to HOD
                                    console.log("User already in team, updating role to HOD");
                                    await execute("UPDATE job_hiring_team SET role = 'HOD' WHERE job_id = ? AND user_id = ?", [id, newHodUserId]);
                                } else {
                                    // Insert as HOD
                                    console.log("Inserting user as HOD");
                                    await execute("INSERT INTO job_hiring_team (job_id, user_id, role) VALUES (?, ?, 'HOD')", [id, newHodUserId]);
                                }

                                // 3d. Remove OLD HOD(s) who are NOT the new HOD
                                await execute("DELETE FROM job_hiring_team WHERE job_id = ? AND role = 'HOD' AND user_id != ?", [id, newHodUserId]);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("HOD Sync Failed:", e);
            }
        }

        const team = await query(`
            SELECT t.id, t.user_id, t.role, u.name, u.email, u.avatar_url, u.emp_id
            FROM job_hiring_team t
            JOIN users u ON t.user_id = u.id
            WHERE t.job_id = ?
            ORDER BY t.created_at ASC
        `, [id]);
        return NextResponse.json(team);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/jobs/[id]/team - Add member
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();

        let userId = body.user_id;
        const role = body.role;

        // If emp_id is provided (from HOD adding department employee), create/get user first
        if (body.emp_id && !userId) {
            // Check if user already exists by emp_id or email
            const existingUsers = await query(
                "SELECT id FROM users WHERE emp_id = ? OR email = ? LIMIT 1",
                [body.emp_id, body.email]
            ) as any[];

            if (existingUsers.length > 0) {
                userId = existingUsers[0].id;
            } else {
                // Create new user
                const insertResult = await execute(
                    `INSERT INTO users (email, name, emp_id, department, role, status, addedDate, addedBy)
                     VALUES (?, ?, ?, ?, 'user', 'active', NOW(), 'System')`,
                    [body.email, body.name, body.emp_id, body.department]
                );
                userId = (insertResult as any).insertId;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "User ID or employee info required" }, { status: 400 });
        }

        await execute(`
            INSERT INTO job_hiring_team (job_id, user_id, role)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE role = VALUES(role)
        `, [id, userId, role]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        // Handle unique constraint error gracefully if needed, but ON DUPLICATE handles it
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/jobs/[id]/team - Update member role
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const { user_id, role } = body;

        await execute(`
            UPDATE job_hiring_team 
            SET role = ? 
            WHERE job_id = ? AND user_id = ?
        `, [role, id, user_id]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/jobs/[id]/team?user_id=123 - Remove member
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const user_id = searchParams.get("user_id");

    if (!user_id) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

    try {
        await execute(`
            DELETE FROM job_hiring_team 
            WHERE job_id = ? AND user_id = ?
        `, [id, user_id]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
