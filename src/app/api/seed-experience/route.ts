
import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

export async function GET() {
    try {
        // Get latest app
        const rows = await query("SELECT id FROM job_applications ORDER BY id DESC LIMIT 1");
        if (rows.length === 0) return NextResponse.json({ error: "No apps found" });

        const id = rows[0].id;

        // Sample Experience Data matching user's screenshot context
        const sampleExperience = [
            {
                title: "Manager Blood Bank",
                company: "Indus Hospital",
                location: "Multan",
                start_date: "2024-01-01",
                end_date: null,
                is_current: true,
                description: "Managing blood bank operations..."
            }
        ];

        await execute(
            "UPDATE job_applications SET experience = ? WHERE id = ?",
            [JSON.stringify(sampleExperience), id]
        );

        return NextResponse.json({ success: true, updated_id: id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
