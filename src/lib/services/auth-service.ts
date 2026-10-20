import { connectDb } from "@/lib/db/connection";
import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/errors";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  revokeAllUserSessions,
  revokeSessionByToken,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth/session";
import { generateSecureToken, hashToken, isTokenExpired } from "@/lib/security/tokens";
import { rateLimit } from "@/lib/security/rate-limit";
import { User, Workspace, WorkspaceMembership } from "@/models";
import { recordAudit } from "./audit";
import { enqueueJob } from "@/lib/jobs/queue";
import { slugify } from "@/lib/utils/slug";

function assertAuthRateLimit(key: string) {
  const env = getEnv();
  const result = rateLimit({
    key: `auth:${key}`,
    limit: env.AUTH_RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  });
  if (!result.allowed) {
    throw new AppError("RATE_LIMITED", "Too many attempts. Please try again shortly.");
  }
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  userAgent?: string | null;
  ip?: string | null;
}) {
  assertAuthRateLimit(`register:${input.ip ?? "unknown"}`);

  const strength = validatePasswordStrength(input.password);
  if (strength) throw new AppError("VALIDATION_ERROR", strength);

  await connectDb();
  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("CONFLICT", "An account with this email already exists");
  }

  const verifyRaw = generateSecureToken(24);
  const env = getEnv();
  const isAdminBootstrap =
    env.ADMIN_EMAIL && email === env.ADMIN_EMAIL.toLowerCase();

  const user = await User.create({
    email,
    name: input.name.trim(),
    passwordHash: await hashPassword(input.password),
    role: isAdminBootstrap ? "platform_admin" : "user",
    emailVerificationTokenHash: hashToken(verifyRaw),
    emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    onboardingStep: 1,
  });

  const { rawToken } = await createSession(String(user._id), {
    userAgent: input.userAgent,
    ip: input.ip,
  });
  await setSessionCookie(rawToken);

  await enqueueJob({
    type: "send_email",
    idempotencyKey: `verify-email:${user._id}`,
    payload: {
      to: user.email,
      template: "verify_email",
      data: {
        name: user.name,
        verifyUrl: `${env.APP_URL}/verify-email?token=${verifyRaw}`,
      },
    },
  });

  await recordAudit({
    actorUserId: user._id,
    actorType: "user",
    eventType: "user.registered",
    entityType: "user",
    entityId: user._id,
    summary: "User registered",
  });

  return { userId: String(user._id), email: user.email, name: user.name };
}

export async function loginUser(input: {
  email: string;
  password: string;
  userAgent?: string | null;
  ip?: string | null;
}) {
  assertAuthRateLimit(`login:${input.ip ?? "unknown"}:${input.email.toLowerCase()}`);
  await connectDb();

  const user = await User.findOne({ email: input.email.toLowerCase().trim() }).select(
    "+passwordHash"
  );
  if (!user || !user.isActive) {
    throw new AppError("UNAUTHORIZED", "Invalid email or password");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new AppError("UNAUTHORIZED", "Invalid email or password");

  user.lastLoginAt = new Date();
  await user.save();

  const { rawToken } = await createSession(String(user._id), {
    userAgent: input.userAgent,
    ip: input.ip,
  });
  await setSessionCookie(rawToken);

  return {
    userId: String(user._id),
    email: user.email,
    name: user.name,
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
  };
}

export async function logoutUser(rawToken?: string | null) {
  if (rawToken) await revokeSessionByToken(rawToken);
  await clearSessionCookie();
}

export async function requestPasswordReset(email: string, ip?: string | null) {
  assertAuthRateLimit(`reset:${ip ?? "unknown"}`);
  await connectDb();
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Always succeed to avoid account enumeration
  if (!user) return { ok: true };

  const raw = generateSecureToken(24);
  user.passwordResetTokenHash = hashToken(raw);
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const env = getEnv();
  await enqueueJob({
    type: "send_email",
    idempotencyKey: `reset:${user._id}:${user.passwordResetExpiresAt?.getTime()}`,
    payload: {
      to: user.email,
      template: "password_reset",
      data: {
        name: user.name,
        resetUrl: `${env.APP_URL}/reset-password?token=${raw}`,
      },
    },
  });

  return { ok: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const strength = validatePasswordStrength(newPassword);
  if (strength) throw new AppError("VALIDATION_ERROR", strength);

  await connectDb();
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
  }).select("+passwordResetTokenHash");

  if (
    !user ||
    !user.passwordResetExpiresAt ||
    isTokenExpired(user.passwordResetExpiresAt)
  ) {
    throw new AppError("GONE", "This reset link is invalid or has expired");
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();
  await revokeAllUserSessions(String(user._id));

  await recordAudit({
    actorUserId: user._id,
    actorType: "user",
    eventType: "user.password_reset",
    entityType: "user",
    entityId: user._id,
    summary: "Password reset completed",
  });

  return { ok: true };
}

export async function verifyEmail(token: string) {
  await connectDb();
  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
  }).select("+emailVerificationTokenHash");

  if (
    !user ||
    !user.emailVerificationExpiresAt ||
    isTokenExpired(user.emailVerificationExpiresAt)
  ) {
    throw new AppError("GONE", "This verification link is invalid or has expired");
  }

  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save();

  return { ok: true };
}

export async function completeOnboardingWorkspace(input: {
  userId: string;
  workspaceName: string;
  type: "freelancer" | "agency";
  currency: string;
  timezone: string;
  defaultPricingModel: "fixed" | "hourly" | "milestone";
  defaultHourlyRateMinor?: number;
}) {
  await connectDb();
  const user = await User.findById(input.userId);
  if (!user) throw new AppError("NOT_FOUND", "User not found");

  const baseSlug = slugify(input.workspaceName);
  let slug = baseSlug;
  let n = 1;
  while (await Workspace.findOne({ slug })) {
    slug = `${baseSlug}-${n++}`;
  }

  const workspace = await Workspace.create({
    name: input.workspaceName.trim(),
    slug,
    type: input.type,
    ownerId: user._id,
    currency: input.currency.toUpperCase(),
    timezone: input.timezone,
    defaultPricingModel: input.defaultPricingModel,
    defaultHourlyRateMinor: input.defaultHourlyRateMinor ?? 0,
    planId: "free",
    subscriptionStatus: "unconfigured",
  });

  await WorkspaceMembership.create({
    workspaceId: workspace._id,
    userId: user._id,
    role: "owner",
    status: "active",
    joinedAt: new Date(),
    permissions: {
      canPrepareProposals: true,
      canSendProposals: true,
      canManageBilling: true,
      canManageTeam: true,
      canManageIntegrations: true,
    },
  });

  user.timezone = input.timezone;
  user.onboardingStep = Math.max(user.onboardingStep, 5);
  await user.save();

  await recordAudit({
    workspaceId: workspace._id,
    actorUserId: user._id,
    actorType: "user",
    eventType: "workspace.created",
    entityType: "workspace",
    entityId: workspace._id,
    summary: `Workspace "${workspace.name}" created`,
  });

  return {
    workspaceId: String(workspace._id),
    slug: workspace.slug,
    name: workspace.name,
  };
}
