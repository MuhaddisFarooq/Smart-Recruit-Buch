import { NextResponse } from "next/server";

export async function GET() {
    try {
        const res = await fetch("https://buchhospital.com/ppapi/emp_department.php", {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            },
            cache: "no-store"
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch departments: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error fetching departments:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
