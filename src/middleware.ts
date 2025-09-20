export { default } from "next-auth/middleware"



import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { superAdmin } from "./lib/constants";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, 
    //  secureCookie: true
   });
  const pathname = req.nextUrl.pathname;
// console.log('token', token)
  // If not logged in, redirect to sign-in
  if (!token) {
    const signInUrl = new URL("/", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Extract allowed pages from token
  const pages:any = token.pages || [];
  const isAllowed = token.role === superAdmin || pathname=='/dashboard' || pages?.some((page: any) => pathname.startsWith(page.path));

  if (isAllowed) {
    return NextResponse.next();
  }

  // Not allowed — redirect to unauthorized or home
  const unauthorizedUrl = new URL("/dashboard", req.url); // create this page if needed
  unauthorizedUrl.searchParams.set("unauthorized", "true");
  return NextResponse.redirect(unauthorizedUrl);
}

// 👇 Define protected routes here
export const config = {
  matcher: [
  "/manage-students/:path*",
  "/assign-permissions/:path*",

]

  // matcher: [
  //   "/dashboard/:path*",
  //   "/admissions/:path*",
  //   "/admission-fee-process/:path*",
  //   "/change-password/:path*",
  //   // "/manage-pages/:path*",
  //   // "/manage-users/:path*",
  //   // "/manage-roles/:path*",
  //   // "/manage-permissions/:path*",
  //   // "/manage-actions/:path*",
  //   // "/assign-permissions/:path*",
  //   // "/manage-programs/:path*",
  //   // "/settings/:path*",
  //   // "/api/private/:path*"
  // ]
};
