import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/admin",
  "/dashboard",
  "/onboarding",
  "/profile",
  "/settings",
  "/notifications",
];

function hasSession(request: NextRequest): boolean {
  return Array.from(request.cookies).some(
    ([name]) => name.startsWith("a_session_") && name !== "a_session_" && name.length > "a_session_".length
  );
}

function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtected && !hasSession(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return setSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return setSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/notifications/:path*",
  ],
};
