import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_NAME: z.string().default("ScopePilot"),
  MONGODB_URI: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  SESSION_COOKIE_NAME: z.string().default("scopepilot_session"),
  SESSION_MAX_AGE_DAYS: z.coerce.number().int().positive().default(14),
  CSRF_SECRET: z.string().min(16).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("ScopePilot <noreply@localhost>"),
  AI_PROVIDER: z.enum(["openai", "none"]).default("none"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  AI_MAX_TOKENS: z.coerce.number().default(2000),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_PATH: z.string().default("./uploads"),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_AGENCY: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),
  ADMIN_EMAIL: z.string().email().optional().or(z.literal("")),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  /** When true, skip login/signup and auto-enter as the seeded demo user. */
  DEMO_OPEN_ACCESS: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined) return true; // local demo default: no auth gate
      if (typeof v === "boolean") return v;
      return v === "true" || v === "1";
    }),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    APP_NAME: process.env.APP_NAME,
    MONGODB_URI: process.env.MONGODB_URI ?? (process.env.NODE_ENV === "test" ? "mongodb://127.0.0.1:27017/scopepilot-test" : undefined),
    SESSION_SECRET:
      process.env.SESSION_SECRET ??
      (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development"
        ? "dev-only-session-secret-change-in-production-32chars"
        : undefined),
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
    SESSION_MAX_AGE_DAYS: process.env.SESSION_MAX_AGE_DAYS,
    CSRF_SECRET: process.env.CSRF_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    AI_PROVIDER: process.env.AI_PROVIDER ?? (process.env.OPENAI_API_KEY ? "openai" : "none"),
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    AI_MAX_TOKENS: process.env.AI_MAX_TOKENS,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
    STRIPE_PRICE_AGENCY: process.env.STRIPE_PRICE_AGENCY,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    LOG_LEVEL: process.env.LOG_LEVEL,
    DEMO_OPEN_ACCESS: process.env.DEMO_OPEN_ACCESS,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  cached = parsed.data;
  return cached;
}

export function isAiConfigured(): boolean {
  const env = getEnv();
  return env.AI_PROVIDER === "openai" && Boolean(env.OPENAI_API_KEY);
}

export function isEmailConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.SMTP_HOST && env.SMTP_USER);
}

export function isWhatsAppConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

export function isBillingConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function resetEnvCache(): void {
  cached = null;
}
