// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const pathname = req.nextUrl.pathname;

  // Determine if the path is a public candidate path (browsing jobs)
  // We allow /candidate/jobs and /candidate/jobs/[id] but NOT /apply, /refer, or /message
  const isPublicCandidatePath = pathname.startsWith("/candidate/jobs") &&
    !pathname.endsWith("/apply") &&
    !pathname.endsWith("/refer") &&
    !pathname.endsWith("/message");

  // Check if path is admin/dashboard area
  const isAdminPath = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/people") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/reports");

  // Check if path is candidate area
  const isCandidatePath = pathname.startsWith("/candidate");

  // If not signed in, send to sign-in page ONLY if not already there AND not a public path
  if (!token && pathname !== "/" && pathname !== "/register" && pathname !== "/verify-otp" && !isPublicCandidatePath) {
    const url = req.nextUrl.clone();
    url.pathname = "/register";
    url.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(url);
  }

  // If signed in, enforce role-based routing
  if (token) {
    const userRole = ((token as any).role || "candidate").toLowerCase();
    const userAccess = ((token as any).access || "candidate").toLowerCase();

    // List of privileged roles that should definitely access admin dashboard
    const privilegedRoles = ["superadmin", "admin", "hr", "hod"];
    const isPrivileged = privilegedRoles.includes(userRole);

    // Candidates should not access admin dashboard
    // We only block if they are NOT privileged AND appear to be a candidate
    if (!isPrivileged && (userRole === "candidate" || userAccess === "candidate") && isAdminPath) {
      const url = req.nextUrl.clone();
      url.pathname = "/candidate/jobs";
      return NextResponse.redirect(url);
    }

    // Admin/HR/HOD trying to access candidate paths can proceed (they may want to preview)
    // But if they go to root, redirect them to dashboard
    if (pathname === "/" && userRole !== "candidate" && userAccess !== "candidate") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Candidates going to root should go to candidate jobs
    if (pathname === "/" && (userRole === "candidate" || userAccess === "candidate")) {
      const url = req.nextUrl.clone();
      url.pathname = "/candidate/jobs";
      return NextResponse.redirect(url);
    }
  }

  // Signed in -> allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded files)
     * - images (static images)
     * - img (static images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|images|img|.*\\.(?:jpg|jpeg|gif|png|svg|ico|css|js|mp3|wav)$).*)',
  ],
};
