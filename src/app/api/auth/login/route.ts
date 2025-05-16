import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "../../../../lib/auth/oauth/base";
import { getCookieAdapter } from "../../../../lib/auth/cookies";

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider");

  if (provider !== "github") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  try {
    const oauthClient = getOAuthClient("github");
    const cookies = await getCookieAdapter();

    const authUrl = oauthClient.createAuthUrl(cookies);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
