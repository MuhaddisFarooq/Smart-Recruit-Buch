// middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If not signed in, send to sign-in page ONLY if not already there
  if (!token && req.nextUrl.pathname !== "/" && req.nextUrl.pathname !== "/register") {
    return NextResponse.redirect(new URL("/", req.url));
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
