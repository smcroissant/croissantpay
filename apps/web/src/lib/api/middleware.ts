import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { app } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, checkOrganizationLimits } from "./rate-limit";
import { incrementApiRequests } from "@/lib/services/usage";
import { isCloudMode } from "@/lib/config";
import {
  logApiRequest,
  extractRequestInfo,
  headersToObject,
} from "@/lib/services/api-logs";

export interface ApiContext {
  app: typeof app.$inferSelect;
  isSecretKey: boolean;
}

// API Key authentication middleware with rate limiting
export async function withApiKey(
  request: NextRequest,
  handler: (context: ApiContext) => Promise<Response>
): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader) {
    return NextResponse.json(
      { error: "Missing authorization header" },
      { status: 401 }
    );
  }

  // Support both "Bearer <key>" and "<key>" formats
  const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Invalid API key format" },
      { status: 401 }
    );
  }

  // Determine if it's a public or secret key
  const isSecretKey = apiKey.startsWith("mx_secret_") || apiKey.startsWith("mxs_");
  const isPublicKey = apiKey.startsWith("mx_public_") || apiKey.startsWith("mxp_");

  if (!isSecretKey && !isPublicKey) {
    return NextResponse.json(
      { error: "Invalid API key prefix" },
      { status: 401 }
    );
  }

  // Check rate limit
  const rateLimitResult = checkRateLimit(apiKey, isSecretKey ? "secret" : "public");
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: "Rate limit exceeded", 
        retryAfter: rateLimitResult.retryAfter 
      },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
          "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
        }
      }
    );
  }

  // Find the app by API key
  const [foundApp] = await db
    .select()
    .from(app)
    .where(isSecretKey ? eq(app.secretKey, apiKey) : eq(app.publicKey, apiKey))
    .limit(1);

  if (!foundApp) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  }

  // Check organization usage limits in cloud mode
  if (isCloudMode()) {
    const limitsCheck = await checkOrganizationLimits(foundApp.organizationId, "apiRequests");
    if (!limitsCheck.allowed) {
      return NextResponse.json(
        { error: limitsCheck.error },
        { status: 402 }
      );
    }
    
    // Track API usage
    await incrementApiRequests(foundApp.organizationId);
  }

  // Capture request info for logging
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(request.headers);
  const url = new URL(request.url);
  let requestBody: Record<string, unknown> | undefined;
  
  // Try to get request body for logging
  try {
    const clonedRequest = request.clone();
    requestBody = await clonedRequest.json();
  } catch {
    // No body or not JSON
  }

  // Execute handler and add rate limit headers
  let response: Response;
  let responseBody: Record<string, unknown> | undefined;
  let errorMessage: string | undefined;

  try {
    response = await handler({ app: foundApp, isSecretKey });
    
    // Try to capture response body for logging
    try {
      const clonedResponse = response.clone();
      responseBody = await clonedResponse.json();
    } catch {
      // Not JSON response
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  const responseTime = Date.now() - startTime;
  
  // Clone response to add headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
  
  newResponse.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
  newResponse.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
  newResponse.headers.set("X-RateLimit-Reset", rateLimitResult.resetAt.toISOString());

  // Log the request asynchronously (don't await)
  logApiRequest({
    organizationId: foundApp.organizationId,
    appId: foundApp.id,
    method: request.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    headers: headersToObject(request.headers),
    body: requestBody,
    statusCode: newResponse.status,
    responseBody,
    responseTime,
    ipAddress: requestInfo.ipAddress || undefined,
    userAgent: requestInfo.userAgent || undefined,
    apiKeyType: requestInfo.apiKeyType || undefined,
    apiKeyPrefix: requestInfo.apiKeyPrefix || undefined,
    errorMessage,
  }).catch((err) => console.error("[API Log] Async log error:", err));
  
  return newResponse;
}

// Require secret key for admin operations
export async function requireSecretKey(
  request: NextRequest,
  handler: (context: ApiContext) => Promise<Response>
): Promise<Response> {
  return withApiKey(request, async (context) => {
    if (!context.isSecretKey) {
      return NextResponse.json(
        { error: "Secret key required for this operation" },
        { status: 403 }
      );
    }
    return handler(context);
  });
}

// JSON response helpers
export function successResponse<T>(data: T, status: number = 200): Response {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): Response {
  return NextResponse.json(
    { error: message, ...details },
    { status }
  );
}

// Parse JSON body with error handling
export async function parseBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

