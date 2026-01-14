import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    const columns = [
        "ADD COLUMN cnic VARCHAR(20) NULL",
        "ADD COLUMN phone VARCHAR(20) NULL",
        "ADD COLUMN designation VARCHAR(100) NULL",
        "ADD COLUMN department VARCHAR(100) NULL",
        "ADD COLUMN joining_date DATE NULL",
        "ADD COLUMN employee_id VARCHAR(50) NULL"
    ];

    const results = [];

    for (const col of columns) {
        try {
            await execute(`ALTER TABLE users ${col}`);
            results.push({ command: col, status: "Success" });
        } catch (error: any) {
            // Ignore duplicate column errors
            if (error.code === 'ER_DUP_FIELDNAME') {
                results.push({ command: col, status: "Already exists" });
            } else {
                results.push({ command: col, status: "Error", message: error.message });
            }
        }
    }

    return NextResponse.json({ results });
}
