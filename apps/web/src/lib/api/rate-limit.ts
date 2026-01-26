import { NextRequest, NextResponse } from "next/server";
import { isCloudMode } from "@/lib/config";
import { checkUsageLimit, incrementApiRequests } from "@/lib/services/usage";
import { db } from "@/lib/db";
import { app } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getRedis } from "@/lib/redis";

// Fixed-window rate limit Lua script (atomic INCR + EXPIRE on first request).
// Returns [count, ttl] where ttl is seconds until key expiry.
const RATE_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {current, ttl}
`;

// In-memory fallback when REDIS_URL is not set (e.g. local dev)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  public: { limit: 100, windowSeconds: 60 },
  secret: { limit: 1000, windowSeconds: 60 },
};

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

async function checkRateLimitRedis(
  key: string,
  type: "public" | "secret"
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type];
  const redis = getRedis();
  if (!redis) {
    return checkRateLimitMemory(key, type);
  }

  const redisKey = `ratelimit:${key}`;
  try {
    const result = await redis.eval(
      RATE_LIMIT_SCRIPT,
      1,
      redisKey,
      config.windowSeconds.toString()
    );
    const [count, ttl] = (result as [number, number]) ?? [0, 0];
    const now = Date.now();
    const resetAt = new Date(now + ttl * 1000);
    const remaining = Math.max(0, config.limit - count);
    const allowed = count <= config.limit;

    return {
      allowed,
      limit: config.limit,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : Math.max(1, ttl),
    };
  } catch (err) {
    console.error("[rate-limit] Redis error, failing open:", err);
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    };
  }
}

function checkRateLimitMemory(
  key: string,
  type: "public" | "secret"
): RateLimitResult {
  const config = RATE_LIMITS[type];
  const now = Date.now();

  let entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + config.windowSeconds * 1000,
    };
  }
  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.limit - entry.count);
  const allowed = entry.count <= config.limit;

  return {
    allowed,
    limit: config.limit,
    remaining,
    resetAt: new Date(entry.resetAt),
    retryAfter: allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000),
  };
}

export async function checkRateLimit(
  identifier: string,
  type: "public" | "secret"
): Promise<RateLimitResult> {
  const key = `${type}:${identifier}`;
  if (process.env.REDIS_URL && getRedis()) {
    return checkRateLimitRedis(key, type);
  }
  return checkRateLimitMemory(key, type);
}

export async function withRateLimit(
  request: NextRequest,
  apiKey: string,
  isSecretKey: boolean,
  handler: () => Promise<Response>
): Promise<Response> {
  const type = isSecretKey ? "secret" : "public";
  const result = await checkRateLimit(apiKey, type);

  const headers = new Headers();
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

  if (!result.allowed) {
    headers.set("Retry-After", result.retryAfter?.toString() ?? "60");
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        retryAfter: result.retryAfter,
      }),
      { status: 429, headers }
    );
  }

  if (isCloudMode()) {
    try {
      const [foundApp] = await db
        .select()
        .from(app)
        .where(isSecretKey ? eq(app.secretKey, apiKey) : eq(app.publicKey, apiKey))
        .limit(1);
      if (foundApp) {
        await incrementApiRequests(foundApp.organizationId);
      }
    } catch (error) {
      console.error("Failed to track API usage:", error);
    }
  }

  const response = await handler();
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  headers.forEach((value, key) => newResponse.headers.set(key, value));
  return newResponse;
}

export async function checkOrganizationLimits(
  organizationId: string,
  metric: "subscribers" | "apiRequests" | "apps"
): Promise<{ allowed: boolean; error?: string }> {
  if (!isCloudMode()) return { allowed: true };
  const result = await checkUsageLimit(organizationId, metric);
  if (!result.allowed) {
    return {
      allowed: false,
      error: `You've reached your ${metric} limit. Please upgrade your plan.`,
    };
  }
  return { allowed: true };
}

export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) rateLimitStore.delete(key);
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
