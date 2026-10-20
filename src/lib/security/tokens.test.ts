import { describe, expect, it } from "vitest";
import {
  generateSecureToken,
  hashToken,
  isTokenExpired,
  tokensMatch,
} from "./tokens";

describe("tokens", () => {
  it("generates high-entropy unique tokens", () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });

  it("hashes and verifies tokens", () => {
    const raw = generateSecureToken();
    const hash = hashToken(raw);
    expect(hash).toHaveLength(64);
    expect(tokensMatch(raw, hash)).toBe(true);
    expect(tokensMatch("wrong", hash)).toBe(false);
  });

  it("detects expiration", () => {
    expect(isTokenExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isTokenExpired(new Date(Date.now() + 60_000))).toBe(false);
    expect(isTokenExpired(null)).toBe(false);
  });
});
