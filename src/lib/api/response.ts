import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export function jsonOk<T>(data: T, init?: { status?: number; headers?: HeadersInit }) {
  return NextResponse.json({ success: true, data }, { status: init?.status ?? 200, headers: init?.headers });
}

export function jsonCreated<T>(data: T) {
  return jsonOk(data, { status: 201 });
}

export function jsonError(err: unknown, requestId?: string) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: err.flatten(),
          requestId,
        },
      },
      { status: 400 }
    );
  }

  if (isAppError(err)) {
    if (err.status >= 500) {
      logger.error({ err, requestId }, err.message);
    }
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.expose ? err.message : "Something went wrong",
          details: err.expose ? err.details : undefined,
          requestId,
        },
      },
      { status: err.status }
    );
  }

  logger.error({ err, requestId }, "Unhandled error");
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
        requestId,
      },
    },
    { status: 500 }
  );
}

export function withErrorHandling(
  handler: (req: Request, ctx?: unknown) => Promise<Response>
) {
  return async (req: Request, ctx?: unknown) => {
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    try {
      const res = await handler(req, ctx);
      res.headers.set("x-request-id", requestId);
      return res;
    } catch (err) {
      const res = jsonError(err, requestId);
      res.headers.set("x-request-id", requestId);
      return res;
    }
  };
}

export function assertFound<T>(value: T | null | undefined, message = "Resource not found"): T {
  if (value == null) throw new AppError("NOT_FOUND", message);
  return value;
}
