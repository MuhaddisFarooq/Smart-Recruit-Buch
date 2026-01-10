import { NextResponse } from "next/server";
import { execute } from "../../../lib/db";

export async function GET() {
    try {
        const columnsToAdd = [
            { name: "internal_notes", type: "TEXT" },
            { name: "target_hiring_date", type: "DATE" },
            { name: "attachments", type: "TEXT" }
        ];

        const results = [];

        for (const col of columnsToAdd) {
            try {
                await execute(`ALTER TABLE jobs ADD COLUMN ${col.name} ${col.type}`);
                results.push(`Added ${col.name}`);
            } catch (error: any) {
                if (error.message && error.message.includes("Duplicate column name")) {
                    results.push(`${col.name} exists`);
                } else {
                    results.push(`Error ${col.name}: ${error.message}`);
                }
            }
        }
        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
