import { db } from "@/lib/db";
import { apiRequestLog, app } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface LogApiRequestParams {
  organizationId: string;
  appId?: string | null;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  statusCode: number;
  responseBody?: Record<string, unknown>;
  responseTime?: number;
  ipAddress?: string;
  userAgent?: string;
  apiKeyType?: string;
  apiKeyPrefix?: string;
  subscriberId?: string;
  appUserId?: string;
  errorMessage?: string;
  errorStack?: string;
}

/**
 * Log an API request to the database
 */
export async function logApiRequest(params: LogApiRequestParams): Promise<void> {
  try {
    // Validate required params
    if (!params.organizationId) {
      console.error("[API Log] Missing organizationId");
      return;
    }

    // Sanitize headers - remove sensitive data
    const sanitizedHeaders = params.headers
      ? sanitizeHeaders(params.headers)
      : undefined;

    // Sanitize body - mask sensitive fields
    const sanitizedBody = params.body
      ? sanitizeBody(params.body)
      : undefined;

    const sanitizedResponse = params.responseBody
      ? sanitizeBody(params.responseBody)
      : undefined;

    const insertData = {
      organizationId: params.organizationId,
      appId: params.appId || null,
      method: params.method,
      path: params.path,
      query: params.query || null,
      headers: sanitizedHeaders || null,
      body: sanitizedBody || null,
      statusCode: params.statusCode,
      responseBody: sanitizedResponse || null,
      responseTime: params.responseTime || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      apiKeyType: params.apiKeyType || null,
      apiKeyPrefix: params.apiKeyPrefix || null,
      subscriberId: params.subscriberId || null,
      appUserId: params.appUserId || null,
      errorMessage: params.errorMessage || null,
      errorStack: params.errorStack || null,
    };

    await db.insert(apiRequestLog).values(insertData);
  } catch (error) {
    // Log the error with details for debugging
    console.error("[API Log] Failed to log request:", {
      error: error instanceof Error ? error.message : error,
      organizationId: params.organizationId,
      appId: params.appId,
      path: params.path,
      method: params.method,
    });
  }
}

/**
 * Get the organization ID from an app's public or secret key
 */
export async function getOrgIdFromApiKey(
  apiKey: string
): Promise<{ organizationId: string; appId: string } | null> {
  try {
    const isPublicKey = apiKey.startsWith("mx_public_");
    const isSecretKey = apiKey.startsWith("mx_secret_");

    if (!isPublicKey && !isSecretKey) {
      return null;
    }

    const result = await db
      .select({
        organizationId: app.organizationId,
        appId: app.id,
      })
      .from(app)
      .where(isPublicKey ? eq(app.publicKey, apiKey) : eq(app.secretKey, apiKey))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      organizationId: result[0].organizationId,
      appId: result[0].appId,
    };
  } catch (error) {
    console.error("[API Log] Failed to get org from API key:", error);
    return null;
  }
}

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const sensitiveHeaders = [
    "authorization",
    "cookie",
    "x-api-key",
    "x-secret-key",
  ];

  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveHeaders.includes(lowerKey)) {
      // Mask the value but keep some info
      if (lowerKey === "authorization" && value.startsWith("Bearer ")) {
        sanitized[key] = `Bearer ${value.slice(7, 15)}...`;
      } else {
        sanitized[key] = `${value.slice(0, 8)}...`;
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize body to mask sensitive fields
 */
function sanitizeBody(
  body: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveFields = [
    "password",
    "secret",
    "token",
    "apiKey",
    "privateKey",
    "receiptData",
    "purchaseToken",
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some((f) => lowerKey.includes(f.toLowerCase()))) {
      if (typeof value === "string" && value.length > 0) {
        sanitized[key] = `${value.slice(0, 8)}...[REDACTED]`;
      } else {
        sanitized[key] = "[REDACTED]";
      }
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeBody(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Extract relevant info from headers for logging
 */
export function extractRequestInfo(headers: Headers): {
  ipAddress: string | null;
  userAgent: string | null;
  apiKeyType: string | null;
  apiKeyPrefix: string | null;
} {
  const authorization = headers.get("authorization");
  let apiKeyType: string | null = null;
  let apiKeyPrefix: string | null = null;

  if (authorization?.startsWith("Bearer ")) {
    const key = authorization.slice(7);
    if (key.startsWith("mx_public_")) {
      apiKeyType = "public";
      apiKeyPrefix = key.slice(0, 18);
    } else if (key.startsWith("mx_secret_")) {
      apiKeyType = "secret";
      apiKeyPrefix = key.slice(0, 18);
    }
  }

  return {
    ipAddress:
      headers.get("x-forwarded-for")?.split(",")[0] ||
      headers.get("x-real-ip") ||
      null,
    userAgent: headers.get("user-agent"),
    apiKeyType,
    apiKeyPrefix,
  };
}

/**
 * Convert Headers to a plain object for logging
 */
export function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}
