import { NextRequest, NextResponse } from "next/server";
import { getCookieAdapter } from "../../../../lib/auth/cookies";
import { removeUserFromSession } from "../../../../lib/auth/session";

export async function GET(request: NextRequest) {
  const cookies = getCookieAdapter();

  // Remove user session
  removeUserFromSession(cookies);

  // Redirect to login page
  return NextResponse.redirect(new URL("/login", request.url));
}
