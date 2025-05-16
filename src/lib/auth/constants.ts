export const AUTH_PROVIDERS = {
  GITHUB: "github",
} as const;

export type AuthProvider = keyof typeof AUTH_PROVIDERS;
