export class AuthError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

export class OAuthError extends AuthError {
  constructor(message: string, code = "oauth_error") {
    super(message, code);
    this.name = "OAuthError";
  }
}

export class SessionError extends AuthError {
  constructor(message: string, code = "session_error") {
    super(message, code);
    this.name = "SessionError";
  }
}

export function handleAuthError(error: unknown): {
  message: string;
  status: number;
} {
  console.error("Auth error:", error);

  if (error instanceof AuthError) {
    return {
      message: error.message,
      status: 401,
    };
  }

  if (error instanceof Error) {
    return {
      message: "Authentication failed",
      status: 500,
    };
  }

  return {
    message: "Unknown error occurred",
    status: 500,
  };
}
