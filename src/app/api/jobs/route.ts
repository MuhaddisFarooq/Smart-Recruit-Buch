import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

export async function GET(req: NextRequest) {
    try {
        const jobs = await query("SELECT * FROM jobs ORDER BY addedDate DESC");
        return NextResponse.json(jobs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Fallback if session is missing for some reason in dev (though shouldn't trigger if protected)
        // The user requested that the currently logged in user is used.
        const addedBy = session?.user?.name || session?.user?.email || "Unknown User";

        const body = await req.json();
        const {
            job_title,
            type_of_employment,
            department,
            location,
            company_description,
            qualifications,
            experience,
            additional_information,
            status // <--- Added status
        } = body;

        const result = await execute(
            `INSERT INTO jobs (
        job_title, status, type_of_employment, department, location, 
        company_description, qualifications, experience, additional_information,
        addedBy, addedDate, updatedBy, updatedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
            [
                job_title,
                status || 'Active', // Default to Active
                type_of_employment,
                department,
                location,
                company_description,
                qualifications,
                experience,
                additional_information,
                addedBy,
                addedBy, // initially updatedBy is same as addedBy
            ]
        );

        return NextResponse.json({ id: result.insertId, message: "Job created successfully" });
    } catch (error: any) {
        console.error("Error creating job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
