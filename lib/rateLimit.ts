import { NextResponse } from "next/server";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}

const authRateLimitStore = new Map<string, { count: number; firstAttemptTime: number; resetTime: number }>();
const generalRateLimitStore = new Map<string, { count: number; firstAttemptTime: number; resetTime: number }>();

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 10;

const GENERAL_WINDOW_MS = 60 * 1000;
const GENERAL_MAX_REQUESTS = 120;

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

function checkMemoryLimit(
  store: Map<string, { count: number; firstAttemptTime: number; resetTime: number }>,
  key: string,
  windowMs: number,
  maxAttempts: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, firstAttemptTime: now, resetTime: now + windowMs });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfterSeconds,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - entry.count),
    resetTime: entry.resetTime,
    retryAfterSeconds: 0,
  };
}

export async function checkAuthRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkMemoryLimit(authRateLimitStore, identifier, AUTH_WINDOW_MS, AUTH_MAX_ATTEMPTS);
}

export async function checkGeneralRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkMemoryLimit(generalRateLimitStore, identifier, GENERAL_WINDOW_MS, GENERAL_MAX_REQUESTS);
}

export function setRateLimitHeaders(headers: Headers, result: RateLimitResult): void {
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.resetTime.toString());
  if (!result.allowed) {
    headers.set("Retry-After", result.retryAfterSeconds.toString());
  }
}
