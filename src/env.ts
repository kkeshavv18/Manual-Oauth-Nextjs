import { z } from "zod";

// Define the schema for environment variables
const envSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1, {
    message: "GITHUB_CLIENT_ID is required",
  }),
  GITHUB_CLIENT_SECRET: z.string().min(1, {
    message: "GITHUB_CLIENT_SECRET is required",
  }),
  OAUTH_REDIRECT_URL_BASE: z.string().url({
    message: "OAUTH_REDIRECT_URL_BASE must be a valid URL",
  }),
  JWT_SECRET: z.string().min(32, {
    message: "JWT_SECRET should be at least 32 characters long for security",
  }),
});

// Define the type based on the schema
type Env = z.infer<typeof envSchema>;

function validateEnv() {
  const rawEnv = {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
    OAUTH_REDIRECT_URL_BASE:
      process.env.OAUTH_REDIRECT_URL_BASE ||
      "http://localhost:3000/api/auth/callback",
    JWT_SECRET: process.env.JWT_SECRET || "",
  };

  // Parse and validate with detailed error reporting
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    console.error("Invalid environment variables:");

    // In development, we might want to continue with warnings
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing or invalid environment variables");
    }
  }

  return result.success ? result.data : (rawEnv as Env);
}

// Export the validated env object
export const env = validateEnv();

