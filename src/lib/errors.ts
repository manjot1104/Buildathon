export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "GONE"
  | "UNPROCESSABLE"
  | "AI_UNAVAILABLE"
  | "INTEGRATION_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { status?: number; details?: unknown; expose?: boolean; cause?: unknown }
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AppError";
    this.code = code;
    this.status = options?.status ?? defaultStatus(code);
    this.details = options?.details;
    this.expose = options?.expose ?? true;
  }
}

function defaultStatus(code: ErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "GONE":
      return 410;
    case "UNPROCESSABLE":
    case "AI_UNAVAILABLE":
    case "INTEGRATION_UNAVAILABLE":
      return 422;
    case "RATE_LIMITED":
      return 429;
    default:
      return 500;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
