import { getCookieAdapter } from "@/lib/auth/cookies";
import { getOAuthClient } from "@/lib/auth/oauth/base";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const oauthClient = getOAuthClient("github");
  const cookies = await getCookieAdapter();

  //revoking access token from github and deleting the session cookie
  await oauthClient.revokeToken(cookies);
  cookies.delete("session");
  return NextResponse.redirect(new URL("/login", request.url));
}
