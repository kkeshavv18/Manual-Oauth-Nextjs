export const env = {
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
  OAUTH_REDIRECT_URL_BASE:
    process.env.OAUTH_REDIRECT_URL_BASE ||
    "http://localhost:3000/api/auth/callback",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
};
