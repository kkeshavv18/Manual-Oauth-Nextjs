import type { ValueOf } from "next/dist/shared/lib/constants";

export const AUTH_PROVIDERS = {
  GITHUB: "github",
} as const;

export type AuthProvider = ValueOf<typeof AUTH_PROVIDERS>;
