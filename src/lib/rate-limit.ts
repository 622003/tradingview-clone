/**
 * Tiny in-process rate limiter — sliding window of timestamps per key.
 *
 * Good enough for single-instance deployments (Vercel preview, single-node
 * Railway/Fly, etc.) and for putting friction on credential-stuffing.
 *
 * For multi-instance prod traffic, swap the Map for Redis or use a CDN-level
 * rate-limit (Vercel WAF, Cloudflare, etc.). The exported API is intentionally
 * tiny so the swap is a few lines.
 */

interface Bucket {
  hits: number[]; // unix ms timestamps
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= limit) {
    const retryAfterMs = bucket.hits[0]! + windowMs - now;
    buckets.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

/** Best-effort client IP. `x-forwarded-for` is the first hop, then x-real-ip, then "unknown". */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
