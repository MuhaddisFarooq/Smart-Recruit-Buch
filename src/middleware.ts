// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Determine if the path is a public candidate path (browsing jobs)
  // We allow /candidate/jobs and /candidate/jobs/[id] but NOT /apply, /refer, or /message
  const isPublicCandidatePath = req.nextUrl.pathname.startsWith("/candidate/jobs") &&
    !req.nextUrl.pathname.endsWith("/apply") &&
    !req.nextUrl.pathname.endsWith("/refer") &&
    !req.nextUrl.pathname.endsWith("/message");

  // If not signed in, send to sign-in page ONLY if not already there AND not a public path
  if (!token && req.nextUrl.pathname !== "/" && req.nextUrl.pathname !== "/register" && req.nextUrl.pathname !== "/verify-otp" && !isPublicCandidatePath) {
    // If trying to access a protected page (like apply), redirect to register/login?
    // User asked to be prompted to register. Let's send to /register?callbackUrl=... or just /register
    // But standard is login usually. I'll stick to / (login) or /register if user insists. 
    // "prompted to register...". I will redirect to /register.
    const url = req.nextUrl.clone();
    url.pathname = "/register";
    url.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(url);
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
