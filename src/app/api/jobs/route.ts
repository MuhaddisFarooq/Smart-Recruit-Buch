import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

// Helper to get user ID
async function getUserId(session: any) {
    if (!session?.user) return null;
    let userId = (session.user as any).id;
    if (!userId && session.user.email) {
        const rows = await query("SELECT id FROM users WHERE email = ?", [session.user.email]);
        if (Array.isArray(rows) && rows.length > 0) {
            userId = (rows[0] as any).id;
        }
    }
    return userId;
}

export async function GET(req: NextRequest) {
    try {
        // Auto-unpublish jobs logic (Commented out temporarily to prevent potential DB locks on GET)
        /*
        await execute(`
            UPDATE jobs 
            SET status = 'inactive', auto_unpublish_date = NULL 
            WHERE auto_unpublish_date IS NOT NULL 
            AND auto_unpublish_date < CURDATE() 
            AND (status = 'active' OR status = 'published')
        `, []);
        */

        const session = await getServerSession(authOptions);
        const userId = await getUserId(session);

        // Get user's access level and department for filtering
        const userAccess = (session?.user as any)?.access || 'candidate';
        const userDepartment = (session?.user as any)?.department || null;
        const userRole = (session?.user as any)?.role || 'candidate';

        // Build WHERE clause based on access level
        let whereClause = '';
        const queryParams: any[] = [];

        // HOD users can only see jobs from their department
        if (userAccess === 'hod' || userRole === 'hod') {
            if (userDepartment) {
                whereClause = 'WHERE j.department = ?';
                queryParams.push(userDepartment);
            }
        }
        // User access level - can only see jobs they're part of hiring team
        else if (userAccess === 'user' || userRole === 'user') {
            if (userId) {
                whereClause = 'WHERE j.id IN (SELECT job_id FROM job_hiring_team WHERE user_id = ?)';
                queryParams.push(userId);
            } else {
                // No user ID means no access to any jobs
                whereClause = 'WHERE 1=0';
            }
        }
        // Admin, HR, and superadmin see all jobs (no filter)

        // 1. Fetch Basic Job details (Efficient, no heavy subqueries for counts)
        const basicJobs = await query(`
            SELECT j.*, 
                (SELECT u.name FROM job_hiring_team ht JOIN users u ON ht.user_id = u.id WHERE ht.job_id = j.id AND ht.role = 'HOD' LIMIT 1) as hod_name,
                (SELECT u.name FROM job_hiring_team ht JOIN users u ON ht.user_id = u.id 
                 WHERE ht.job_id = j.id AND ht.role IN ('HR', 'Superadmin', 'Hiring Manager') 
                 ORDER BY CASE ht.role 
                    WHEN 'HR' THEN 1 
                    WHEN 'Superadmin' THEN 2 
                    WHEN 'Hiring Manager' THEN 3 
                    ELSE 4 END 
                 LIMIT 1) as hiring_manager,
                j.advertised_date,
                j.updatedDate
            FROM jobs j 
            ${whereClause}
            ORDER BY j.addedDate DESC
        `, queryParams) as any[];

        if (!basicJobs.length) {
            return NextResponse.json([]);
        }

        // 2. Fetch Aggregated Counts for these jobs (One fast query)
        const jobIds = basicJobs.map(j => j.id);
        if (jobIds.length === 0) return NextResponse.json(basicJobs);

        const countsRows = await query(`
            SELECT job_id, status, COUNT(*) as count 
            FROM job_applications 
            WHERE job_id IN (${jobIds.join(',')})
            GROUP BY job_id, status
        `, []) as any[];

        // 3. fetch "has_applied" status if user is logged in
        let userApplications: any[] = [];
        if (userId) {
            userApplications = await query(`
                SELECT job_id FROM job_applications 
                WHERE user_id = ? AND job_id IN (${jobIds.join(',')})
            `, [userId]) as any[];
        }

        // 4. Merge Data in Memory
        const jobs = basicJobs.map(job => {
            const jobCounts = countsRows.filter(r => r.job_id === job.id);
            const getCount = (status: string) => {
                const row = jobCounts.find(r => r.status === status);
                return row ? row.count : 0;
            };

            return {
                ...job,
                new_count: getCount('new'),
                in_review_count: getCount('reviewed'),
                shortlisted_count: getCount('shortlisted'),
                interview_count: getCount('interview'),
                selected_count: getCount('selected'),
                offered_count: getCount('offered'),
                hired_count: getCount('hired'),
                has_applied: userId ? userApplications.some(ua => ua.job_id === job.id) : false
            };
        });
        return NextResponse.json(jobs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const addedBy = session?.user?.name || session?.user?.email || "Unknown User";

        const body = await req.json();

        // Extract all fields with null fallback to prevent undefined
        const job_title = body.job_title || null;
        const department = body.department || null;
        const department_id = body.department_id || null;
        const hod_id = body.hod_id || null;
        const location = body.location || null;
        const work_location_type = body.work_location_type || null;
        const job_language = body.job_language || null;
        const company_description = body.company_description || null;
        const description = body.description || null;
        const qualifications = body.qualifications || null;
        const additional_info = body.additional_info || null;
        const video_url = body.video_url || null;
        const industry = body.industry || null;
        const job_function = body.function || null;
        const experience_level = body.experience_level || null;
        const type_of_employment = body.type_of_employment || null;
        const salary_from = body.salary_from || null;
        const salary_to = body.salary_to || null;
        const currency = body.currency || null;
        const salary_period = body.salary_period || null;
        const hiring_team = body.hiring_team ? JSON.stringify(body.hiring_team) : null;
        const status = body.status || "draft";

        // New location fields
        const city = body.city || null;
        const state = body.state || null;
        const postal_code = body.postal_code || null;
        const country = body.country || null;

        // Auto unpublish date
        const auto_unpublish_date = body.auto_unpublish_date || null;

        const result = await execute(
            `INSERT INTO jobs (
                job_title, department, department_id, hod_id, location, work_location_type, job_language,
                company_description, description, qualifications, additional_information,
                video_url, industry, job_function, experience_level, type_of_employment,
                salary_from, salary_to, currency, salary_period, hiring_team,
                city, state, postal_code, country, auto_unpublish_date,
                status, addedBy, addedDate, updatedBy, updatedDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
            [
                job_title,
                department,
                department_id,
                hod_id,
                location,
                work_location_type,
                job_language,
                company_description,
                description,
                qualifications,
                additional_info,
                video_url,
                industry,
                job_function,
                experience_level,
                type_of_employment,
                salary_from,
                salary_to,
                currency,
                salary_period,
                hiring_team,
                city,
                state,
                postal_code,
                country,
                auto_unpublish_date,
                status,
                addedBy,
                addedBy,
            ]
        );

        const jobId = (result as any).insertId;

        // Auto-add HOD to Hiring Team if hod_id is present
        if (hod_id) {
            try {
                console.log("Auto-provisioning HOD with ID:", hod_id);

                // First, try to find existing user by emp_id
                let hodUsers = await query(
                    "SELECT id, email, name FROM users WHERE emp_id = ? LIMIT 1",
                    [hod_id]
                ) as any[];

                let hodUserId = null;

                if (hodUsers.length > 0) {
                    // User already exists
                    hodUserId = hodUsers[0].id;
                    console.log("Found existing HOD user:", hodUsers[0].name);
                } else {
                    // Fetch HOD details from external API
                    console.log("HOD not found locally, fetching from external API...");
                    try {
                        const apiRes = await fetch(`https://buchhospital.com/ppapi/emp_info.php?pin=BIH${hod_id}`, {
                            headers: {
                                "User-Agent": "Mozilla/5.0",
                                "Accept": "application/json"
                            }
                        });

                        if (apiRes.ok) {
                            const apiData = await apiRes.json();

                            if (apiData.status === 200 && apiData.data && apiData.data.length > 0) {
                                const hodInfo = apiData.data[0];
                                console.log("Fetched HOD info:", hodInfo.name, hodInfo.email);

                                // Create the HOD user
                                const insertResult = await execute(
                                    `INSERT INTO users (email, name, emp_id, department, role, status, addedDate, addedBy)
                                     VALUES (?, ?, ?, ?, 'hod', 'active', NOW(), ?)
                                     ON DUPLICATE KEY UPDATE 
                                        name = VALUES(name),
                                        emp_id = VALUES(emp_id),
                                        department = VALUES(department),
                                        role = 'hod'`,
                                    [
                                        hodInfo.email,
                                        hodInfo.name,
                                        hodInfo.emp_id || hod_id,
                                        hodInfo.department,
                                        addedBy
                                    ]
                                );

                                // Get the user ID (either new or existing)
                                if ((insertResult as any).insertId) {
                                    hodUserId = (insertResult as any).insertId;
                                } else {
                                    // User existed, get their ID
                                    const existingUser = await query(
                                        "SELECT id FROM users WHERE email = ? LIMIT 1",
                                        [hodInfo.email]
                                    ) as any[];
                                    if (existingUser.length > 0) {
                                        hodUserId = existingUser[0].id;
                                    }
                                }
                                console.log("Created/Updated HOD user with ID:", hodUserId);
                            }
                        }
                    } catch (fetchError) {
                        console.error("Failed to fetch HOD from external API:", fetchError);
                    }
                }

                // Add HOD to hiring team if we have a user ID
                if (hodUserId) {
                    await execute(
                        `INSERT INTO job_hiring_team (job_id, user_id, role) 
                         VALUES (?, ?, 'HOD')
                         ON DUPLICATE KEY UPDATE role = 'HOD'`,
                        [jobId, hodUserId]
                    );
                    console.log("Added HOD to hiring team for job:", jobId);
                }
            } catch (err) {
                console.error("Error auto-adding HOD:", err);
                // Don't fail the whole request
            }
        }

        // Auto-add the HR creator to Hiring Team with role 'HR'
        try {
            // Get the user ID of the person creating the job
            const creatorEmail = session?.user?.email;
            if (creatorEmail) {
                const creatorUsers = await query(
                    "SELECT id, role FROM users WHERE email = ? LIMIT 1",
                    [creatorEmail]
                ) as any[];

                if (creatorUsers.length > 0) {
                    const creatorUserId = creatorUsers[0].id;
                    const creatorRole = creatorUsers[0].role?.toLowerCase();

                    // Add creator to hiring team with appropriate role based on their access
                    // HR users get "HR" role, others get their actual role
                    let teamRole = "HR"; // Default for HR users
                    if (creatorRole === "admin" || creatorRole === "superadmin") {
                        teamRole = "Superadmin";
                    }

                    await execute(
                        `INSERT INTO job_hiring_team (job_id, user_id, role) 
                         VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE role = VALUES(role)`,
                        [jobId, creatorUserId, teamRole]
                    );
                    console.log("Added job creator to hiring team:", addedBy, "with role:", teamRole);
                }
            }
        } catch (err) {
            console.error("Error auto-adding job creator:", err);
            // Don't fail the whole request
        }

        // Insert hiring team members into job_hiring_team table
        if (body.hiring_team && Array.isArray(body.hiring_team) && body.hiring_team.length > 0) {
            const teamValues = body.hiring_team.map((member: any) => [
                jobId,
                member.user_id,
                member.role
            ]);

            // Construct bulk insert query
            const placeholders = teamValues.map(() => "(?, ?, ?)").join(", ");
            const flatValues = teamValues.flat();

            if (teamValues.length > 0) {
                await execute(
                    `INSERT INTO job_hiring_team (job_id, user_id, role) VALUES ${placeholders}
                     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
                    flatValues
                );
            }
        }

        return NextResponse.json({ id: jobId, message: "Job created successfully" });
    } catch (error: any) {
        console.error("Error creating job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
