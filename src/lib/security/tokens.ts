import { createHash, randomBytes, timingSafeEqual } from "crypto";

/** Generate a high-entropy URL-safe token (raw value for delivery only). */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function tokensMatch(rawToken: string, storedHash: string): boolean {
  const hash = hashToken(rawToken);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isTokenExpired(expiresAt: Date | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= now.getTime();
}
