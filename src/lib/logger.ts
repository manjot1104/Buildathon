import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }
    : {}),
  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "rawToken",
      "authorization",
      "cookie",
      "smtp.pass",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
});

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
