import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query, execute } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

// Force Next.js to not cache generic GET requests if they might be dynamic, 
// though for [id] it usually works fine interactively. 
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const rows = await query("SELECT * FROM jobs WHERE id = ?", [id]);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await execute("DELETE FROM jobs WHERE id = ?", [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const updatedBy = session?.user?.name || session?.user?.email || "Unknown User";

        const { id } = await params;
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
            status
        } = body;

        await execute(
            `UPDATE jobs SET 
                job_title = ?, 
                status = ?,
                type_of_employment = ?, 
                department = ?, 
                location = ?, 
                company_description = ?, 
                qualifications = ?, 
                experience = ?, 
                additional_information = ?, 
                updatedBy = ?, 
                updatedDate = NOW()
            WHERE id = ?`,
            [
                job_title,
                status,
                type_of_employment,
                department,
                location,
                company_description,
                qualifications,
                experience,
                additional_information,
                updatedBy,
                id
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating job:", error);
        return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
    }
}
