import { env } from "../../../env";
import { OAuthClient } from "./base";
import { z } from "zod";

export function createGithubOAuthClient() {
  return new OAuthClient({
    provider: "github",
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    scopes: ["user:email", "read:user"],
    urls: {
      auth: "https://github.com/login/oauth/authorize",
      token: "https://github.com/login/oauth/access_token",
      user: "https://api.github.com/user",
      revoke_token: "https://api.github.com/applications",
    },
    userInfo: {
      schema: z.object({
        id: z.number().or(z.string()),
        login: z.string(),
        name: z.string().nullable(), // GitHub sometimes returns null for name too
        email: z.string().nullable(),
      }),
      parser: (user) => ({
        id: user.id.toString(),
        name: user.name ?? user.login,
        email: user.email ?? `${user.login}@github.com`, // Fallback if email is not provided
      }),
    },
  });
}
