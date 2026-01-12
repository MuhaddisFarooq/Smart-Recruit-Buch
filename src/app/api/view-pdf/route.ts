
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const urlPath = searchParams.get("url");

    if (!urlPath) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    try {
        // Security check: ensure path is within public folder
        // The urlPath is like "/uploads/resumes/123.bin"
        // We strip the leading slash
        const relativePath = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
        const filePath = path.join(process.cwd(), "public", relativePath);

        // Verify it exists
        try {
            await fs.access(filePath);
        } catch {
            return new NextResponse("File not found", { status: 404 });
        }

        const fileBuffer = await fs.readFile(filePath);

        // Force PDF content type to trick browser into previewing
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": "inline",
            },
        });
    } catch (error) {
        console.error("Error serving PDF:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
