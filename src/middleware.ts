import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/api/auth/login", "/api/auth/callback/github"];

export function middleware(request: NextRequest) {
  // Get the cookie from the request
  const sessionCookie = request.cookies.get("session");

  // Get the path from the request
  const path = request.nextUrl.pathname;

  // Check if the path is public or if the session cookie exists
  const isPublicPath = publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(publicPath)
  );

  const hasSession = !!sessionCookie;

  // If it's a public path and the user is authenticated, redirect to dashboard
  if (isPublicPath && hasSession && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If it's not a public path and the user is not authenticated, redirect to login
  if (!isPublicPath && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Otherwise, continue with the request
  return NextResponse.next();
}

// Specify the paths that should be handled by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
