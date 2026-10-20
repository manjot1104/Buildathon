import { cookies } from "next/headers";
import { createHash } from "crypto";
import { connectDb } from "@/lib/db/connection";
import { getEnv } from "@/lib/config/env";
import { generateSecureToken, hashToken, isTokenExpired } from "@/lib/security/tokens";
import { Session, User, type UserDocument } from "@/models";
import { AppError } from "@/lib/errors";

export interface AuthSession {
  sessionId: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerifiedAt: Date | null;
    onboardingCompletedAt: Date | null;
    onboardingStep: number;
    timezone: string;
    preferredTone: string;
  };
}

function cookieOptions(maxAgeSeconds: number) {
  const env = getEnv();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function createSession(
  userId: string,
  meta?: { userAgent?: string | null; ip?: string | null }
): Promise<{ rawToken: string; expiresAt: Date }> {
  await connectDb();
  const env = getEnv();
  const rawToken = generateSecureToken(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.SESSION_MAX_AGE_DAYS);

  await Session.create({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
    userAgent: meta?.userAgent ?? null,
    ipHash: meta?.ip ? createHash("sha256").update(meta.ip).digest("hex") : null,
    lastSeenAt: new Date(),
  });

  return { rawToken, expiresAt };
}

export async function setSessionCookie(rawToken: string): Promise<void> {
  const env = getEnv();
  const maxAge = env.SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
  cookies().set(env.SESSION_COOKIE_NAME, rawToken, cookieOptions(maxAge));
}

export async function clearSessionCookie(): Promise<void> {
  const env = getEnv();
  cookies().set(env.SESSION_COOKIE_NAME, "", { ...cookieOptions(0), maxAge: 0 });
}

export async function revokeSessionByToken(rawToken: string): Promise<void> {
  await connectDb();
  await Session.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await connectDb();
  await Session.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function getSessionFromCookies(): Promise<AuthSession | null> {
  const env = getEnv();
  const rawToken = cookies().get(env.SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;
  return getSessionFromToken(rawToken);
}

export async function getSessionFromToken(rawToken: string): Promise<AuthSession | null> {
  await connectDb();
  const session = await Session.findOne({
    tokenHash: hashToken(rawToken),
    revokedAt: null,
  });
  if (!session || isTokenExpired(session.expiresAt)) return null;

  const user = (await User.findById(session.userId).lean()) as UserDocument | null;
  if (!user || !user.isActive) return null;

  // Touch lastSeenAt without blocking
  void Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date() } });

  return {
    sessionId: String(session._id),
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      onboardingCompletedAt: user.onboardingCompletedAt ?? null,
      onboardingStep: user.onboardingStep,
      timezone: user.timezone,
      preferredTone: user.preferredTone,
    },
  };
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getSessionFromCookies();
  if (!session) throw new AppError("UNAUTHORIZED", "Please sign in to continue");
  return session;
}

export async function requirePlatformAdmin(): Promise<AuthSession> {
  const session = await requireSession();
  if (session.user.role !== "platform_admin") {
    throw new AppError("FORBIDDEN", "Platform administrator access required");
  }
  return session;
}
