/**
 * Simple in-memory rate limiter for API protection
 * Works well for single-instance deployments
 *
 * For distributed deployments, replace with @upstash/ratelimit + Redis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store with automatic cleanup
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetIn: number; // seconds until reset
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP, userId, etc.)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and metadata
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = identifier;

  const entry = store.get(key);

  // No existing entry or window expired - create new
  if (!entry || entry.resetAt < now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetIn: config.windowSeconds,
    };
  }

  // Within window - check limit
  const remaining = config.limit - entry.count - 1;
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetIn,
    };
  }

  // Increment counter
  entry.count++;
  store.set(key, entry);

  return {
    success: true,
    limit: config.limit,
    remaining: Math.max(0, remaining),
    resetIn,
  };
}

/**
 * Get client IP from request headers
 * Handles proxies (nginx, cloudflare, etc.)
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;

  // Check common proxy headers
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return "unknown";
}

/**
 * Create rate limit response with proper headers
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      retryAfter: result.resetIn,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetIn.toString(),
        "Retry-After": result.resetIn.toString(),
      },
    }
  );
}

// ============================================
// Pre-configured rate limiters for common use cases
// ============================================

/** Strict limit for auth endpoints (login, register, forgot-password) */
export const AUTH_LIMIT: RateLimitConfig = {
  limit: 5,         // 5 attempts
  windowSeconds: 60, // per minute
};

/** Strict limit for password reset */
export const PASSWORD_RESET_LIMIT: RateLimitConfig = {
  limit: 3,          // 3 attempts
  windowSeconds: 300, // per 5 minutes
};

/** Moderate limit for message sending */
export const MESSAGE_LIMIT: RateLimitConfig = {
  limit: 30,        // 30 messages
  windowSeconds: 60, // per minute
};

/** Moderate limit for payments/credits */
export const PAYMENT_LIMIT: RateLimitConfig = {
  limit: 10,        // 10 requests
  windowSeconds: 60, // per minute
};

/** General API limit */
export const API_LIMIT: RateLimitConfig = {
  limit: 100,       // 100 requests
  windowSeconds: 60, // per minute
};

/** Strict limit for file uploads */
export const UPLOAD_LIMIT: RateLimitConfig = {
  limit: 20,        // 20 uploads
  windowSeconds: 300, // per 5 minutes
};

/** Very strict for verification submissions */
export const VERIFICATION_LIMIT: RateLimitConfig = {
  limit: 3,          // 3 attempts
  windowSeconds: 3600, // per hour
};
