// Simple in-memory rate limiter for edge functions
// Uses a Map with IP-based tracking and sliding window

const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (now > value.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 60_000);

export interface RateLimitConfig {
  maxRequests: number;    // max requests per window
  windowMs: number;       // window size in milliseconds
}

export function checkRateLimit(
  req: Request,
  config: RateLimitConfig = { maxRequests: 60, windowMs: 60_000 }
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  const now = Date.now();
  const key = ip;
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count };
}

export function rateLimitResponse(
  req: Request,
  corsHeaders: Record<string, string>,
  retryAfterMs: number
): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests", retryAfterMs }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
      },
    }
  );
}
