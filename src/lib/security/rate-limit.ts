/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance / early MVP. Replace with Redis for multi-instance production.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export function rateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  let bucket = buckets.get(options.key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(options.key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

  if (bucket.timestamps.length >= options.limit) {
    const oldest = bucket.timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + options.windowMs - now),
    };
  }

  bucket.timestamps.push(now);
  return {
    allowed: true,
    remaining: options.limit - bucket.timestamps.length,
    retryAfterMs: 0,
  };
}

export function resetRateLimits(): void {
  buckets.clear();
}
