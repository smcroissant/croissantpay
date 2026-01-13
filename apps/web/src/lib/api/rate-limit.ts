import { NextRequest, NextResponse } from "next/server";
import { isCloudMode } from "@/lib/config";
import { checkUsageLimit, incrementApiRequests } from "@/lib/services/usage";
import { db } from "@/lib/db";
import { app } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Simple in-memory rate limiter for development
// In production, use Redis
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  // Requests per window
  limit: number;
  // Window size in seconds
  windowSeconds: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Public API key limits (client-side)
  public: {
    limit: 100,
    windowSeconds: 60, // 100 req/min
  },
  // Secret API key limits (server-side)
  secret: {
    limit: 1000,
    windowSeconds: 60, // 1000 req/min
  },
};

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

// Check rate limit for a given identifier
export function checkRateLimit(
  identifier: string,
  type: "public" | "secret"
): RateLimitResult {
  const config = RATE_LIMITS[type];
  const now = Date.now();
  const key = `${type}:${identifier}`;

  let entry = rateLimitStore.get(key);

  // Reset if window expired
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

// Middleware to apply rate limiting to API routes
export async function withRateLimit(
  request: NextRequest,
  apiKey: string,
  isSecretKey: boolean,
  handler: () => Promise<Response>
): Promise<Response> {
  const type = isSecretKey ? "secret" : "public";
  const result = checkRateLimit(apiKey, type);

  // Add rate limit headers
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

  if (!result.allowed) {
    headers.set("Retry-After", result.retryAfter?.toString() || "60");
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers,
      }
    );
  }

  // Track API usage for cloud billing
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

  // Execute the handler
  const response = await handler();

  // Add rate limit headers to response
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  headers.forEach((value, key) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
}

// Check organization usage limits (for cloud mode)
export async function checkOrganizationLimits(
  organizationId: string,
  metric: "subscribers" | "apiRequests" | "apps"
): Promise<{ allowed: boolean; error?: string }> {
  if (!isCloudMode()) {
    return { allowed: true };
  }

  const result = await checkUsageLimit(organizationId, metric);

  if (!result.allowed) {
    return {
      allowed: false,
      error: `You've reached your ${metric} limit. Please upgrade your plan.`,
    };
  }

  return { allowed: true };
}

// Cleanup old rate limit entries (call periodically)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

