import { z } from "zod";
import crypto from "crypto";
import type { AuthProvider } from "../constants";
import { env } from "@/env";
import type { Cookies } from "../cookies";
import { createGithubOAuthClient } from "./github";
import { getUserFromSession } from "../session";

const STATE_COOKIE_KEY = "oAuthState";
const CODE_VERIFIER_COOKIE_KEY = "oAuthCodeVerifier";
// 10 minutes in seconds
const COOKIE_EXPIRATION_SECONDS = 60 * 10;

export class OAuthClient<T> {
  private readonly provider: AuthProvider;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scopes: string[];
  private readonly urls: {
    auth: string;
    token: string;
    user: string;
    revoke_token: string;
  };
  private readonly userInfo: {
    schema: z.ZodSchema<T>;
    parser: (data: T) => { id: string; email: string; name: string };
  };
  private readonly tokenSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
  });

  constructor({
    provider,
    clientId,
    clientSecret,
    scopes,
    urls,
    userInfo,
  }: {
    provider: AuthProvider;
    clientId: string;
    clientSecret: string;
    scopes: string[];
    urls: {
      auth: string;
      token: string;
      user: string;
      revoke_token: string;
    };
    userInfo: {
      schema: z.ZodSchema<T>;
      parser: (data: T) => { id: string; email: string; name: string };
    };
  }) {
    this.provider = provider;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.urls = urls;
    this.userInfo = userInfo;
  }

  private get redirectUrl() {
    return `${env.OAUTH_REDIRECT_URL_BASE}/${this.provider}`;
  }

  createAuthUrl(cookies: Pick<Cookies, "set">) {
    const state = createState(cookies);
    const codeVerifier = createCodeVerifier(cookies);
    const url = new URL(this.urls.auth);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.scopes.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge_method", "S256");

    // Generate code challenge from verifier
    const codeChallenge = generateCodeChallenge(codeVerifier);
    url.searchParams.set("code_challenge", codeChallenge);

    return url.toString();
  }

  async fetchUser(code: string, state: string, cookies: Pick<Cookies, "get">) {
    const isValidState = validateState(state, cookies);
    if (!isValidState) throw new InvalidStateError();

    const codeVerifier = getCodeVerifier(cookies);
    const { accessToken, tokenType } = await this.fetchToken(
      code,
      codeVerifier
    );

    const user = await fetch(this.urls.user, {
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((rawData) => {
        const result = this.userInfo.schema.safeParse(rawData);
        if (!result?.success) throw new InvalidUserError(result?.error);

        return result?.data;
      });

    // Return user info and token for storing in the session
    return {
      ...this.userInfo.parser(user),
      accessToken,
    };
  }

  private async fetchToken(code: string, codeVerifier: string) {
    return fetch(this.urls.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        redirect_uri: this.redirectUrl,
        grant_type: "authorization_code",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code_verifier: codeVerifier,
      }),
    })
      .then((res) => res.json())
      .then((rawData) => {
        const result = this.tokenSchema.safeParse(rawData);

        if (!result.success) {
          throw new InvalidTokenError(result.error);
        }

        const { access_token, token_type } = result.data;

        return {
          accessToken: access_token,
          tokenType: token_type,
        };
      });
  }

  async revokeToken(cookies: Pick<Cookies, "get">) {
    const user = getUserFromSession(cookies);
    if (user?.accessToken && user.provider === "github") {
      const clientId = this.clientId;
      const clientSecret = this.clientSecret;
      if (!clientId || !clientSecret) {
        console.error(
          "GitHub Client ID or Client Secret not configured in environment variables."
        );
        return;
      }
      try {
        const response = await fetch(
          `${this.urls.revoke_token}/${clientId}/grant`,
          {
            method: "DELETE",
            headers: {
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json",
              Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
            },
            body: JSON.stringify({
              access_token: user?.accessToken,
            }),
          }
        );

        if (response.ok || response.status === 204) {
          console.log("Successfully requested GitHub access token revocation.");
          // No content is expected for successful deletion
        } else {
          console.error(
            "Failed to request GitHub access token revocation:",
            response.status,
            await response.text()
          );
        }
      } catch (error) {
        console.error(
          "An error occurred during the GitHub revoke request:",
          error
        );
      }
    }
  }
}

export function getOAuthClient(provider: AuthProvider) {
  switch (provider) {
    case "github":
      return createGithubOAuthClient();
    default:
      throw new Error(`Invalid provider: ${provider satisfies never}`);
  }
}

// Helper functions for PKCE (Proof Key for Code Exchange)
function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(codeVerifier);
  return hash
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function createState(cookies: Pick<Cookies, "set">) {
  const state = crypto.randomBytes(32).toString("hex");
  cookies.set(STATE_COOKIE_KEY, state, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(Date.now() + COOKIE_EXPIRATION_SECONDS * 1000),
  });
  return state;
}

function createCodeVerifier(cookies: Pick<Cookies, "set">) {
  // Code verifier should be between 43-128 characters
  const codeVerifier = crypto.randomBytes(43).toString("base64url");
  cookies.set(CODE_VERIFIER_COOKIE_KEY, codeVerifier, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(Date.now() + COOKIE_EXPIRATION_SECONDS * 1000),
  });
  return codeVerifier;
}

function validateState(state: string, cookies: Pick<Cookies, "get">) {
  const cookieState = cookies.get(STATE_COOKIE_KEY)?.value;
  return cookieState === state;
}

function getCodeVerifier(cookies: Pick<Cookies, "get">) {
  const codeVerifier = cookies.get(CODE_VERIFIER_COOKIE_KEY)?.value;
  if (codeVerifier == null) throw new InvalidCodeVerifierError();
  return codeVerifier;
}

// Error classes
class InvalidTokenError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid Token");
    this.cause = zodError;
  }
}

class InvalidUserError extends Error {
  constructor(zodError: z.ZodError) {
    super("Invalid User");
    this.cause = zodError;
  }
}

class InvalidStateError extends Error {
  constructor() {
    super("Invalid State");
  }
}

class InvalidCodeVerifierError extends Error {
  constructor() {
    super("Invalid Code Verifier");
  }
}
