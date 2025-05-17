import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/auth/oauth/base";
import { getCookieAdapter } from "@/lib/auth/cookies";
import { createUserSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/login?error=missing_params", request.url)
    );
  }

  try {
    const cookies = await getCookieAdapter();
    const oauthClient = getOAuthClient("github");

    // Get user data from GitHub
    const userData = await oauthClient.fetchUser(code, state, cookies);

    // Create a session with user data
    createUserSession(
      {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: "user", // Default role
        accessToken: userData.accessToken,
        provider: "github",
      },
      cookies
    );

    // Redirect to the dashboard after successful login
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
  }
}
