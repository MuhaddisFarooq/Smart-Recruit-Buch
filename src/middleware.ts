// middleware.ts (at project root)
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const SUPER_EMAIL = "superadmin12@gmail.com";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const isSuperAdmin = token.email === SUPER_EMAIL && token.role === "superadmin";

  const path = req.nextUrl.pathname;
  const protectedRoutes = ["/dashboard", "/manage-students", "/assign-permissions"];
  const needsGuard = protectedRoutes.some((p) => path.startsWith(p));

  if (needsGuard && !isSuperAdmin) {
    const url = new URL("/", req.url);
    url.searchParams.set("unauthorized", "true");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/manage-students/:path*", "/assign-permissions/:path*"],
};
