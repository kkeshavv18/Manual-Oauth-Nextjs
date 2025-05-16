import { z } from "zod";
import crypto from "crypto";
import { Cookies } from "./cookies";
import { env } from "../../env";

// Seven days in seconds
const SESSION_EXPIRATION_SECONDS = 60;
const COOKIE_SESSION_KEY = "session";

export const userRoles = ["user", "admin"] as const;

export const sessionSchema = z.object({
  id: z.string(),
  role: z.enum(userRoles),
  email: z.string().email(),
  name: z.string(),
  accessToken: z.string(),
  provider: z.string(),
});

export type UserSession = z.infer<typeof sessionSchema>;

// Instead of Redis, we'll use encrypted cookies
export function getUserFromSession(
  cookies: Pick<Cookies, "get">
): UserSession | null {
  const sessionCookie = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionCookie) return null;

  try {
    const decrypted = decryptSession(sessionCookie);
    const parsedSession = sessionSchema.safeParse(JSON.parse(decrypted));
    return parsedSession.success ? parsedSession.data : null;
  } catch (error) {
    return null;
  }
}

export function createUserSession(
  user: UserSession,
  cookies: Pick<Cookies, "set">
) {
  const sessionData = sessionSchema.parse(user);
  const encrypted = encryptSession(JSON.stringify(sessionData));

  setCookie(encrypted, cookies);
}

export function removeUserFromSession(cookies: Pick<Cookies, "delete">) {
  cookies.delete(COOKIE_SESSION_KEY);
}

function setCookie(sessionData: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, sessionData, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000),
  });
}

// Simple encryption/decryption functions using the JWT_SECRET
function encryptSession(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(env.JWT_SECRET).digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptSession(text: string): string {
  const [ivHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.createHash("sha256").update(env.JWT_SECRET).digest();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
