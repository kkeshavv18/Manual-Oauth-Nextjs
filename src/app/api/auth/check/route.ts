import { NextRequest, NextResponse } from "next/server";
import { getCookieAdapter } from "../../../../lib/auth/cookies";
import { getUserFromSession } from "../../../../lib/auth/session";

export async function GET(request: NextRequest) {
  const cookies = await getCookieAdapter();
  const user = getUserFromSession(cookies);

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      provider: user.provider,
    },
  });
}
