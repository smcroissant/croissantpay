import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { regenerateApiKeys, userHasAppAccess, getApp } from "@/lib/services/apps";

const rotateSchema = z.object({
  keyType: z.enum(["public", "secret", "both"]),
});

// POST /api/v1/apps/:appId/keys - Rotate API keys
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;

  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check user has access to this app
  const hasAccess = await userHasAppAccess(session.user.id, appId);
  if (!hasAccess) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Parse request
  const body = await request.json();
  const result = rotateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten() },
      { status: 400 }
    );
  }

  // Rotate keys
  const newKeys = await regenerateApiKeys(appId);

  // Return only requested key type for security
  const response: Record<string, string> = {};
  
  if (result.data.keyType === "public" || result.data.keyType === "both") {
    response.publicKey = newKeys.publicKey;
  }
  if (result.data.keyType === "secret" || result.data.keyType === "both") {
    response.secretKey = newKeys.secretKey;
  }

  return NextResponse.json({
    success: true,
    message: "API keys rotated successfully",
    ...response,
  });
}

// GET /api/v1/apps/:appId/keys - Get current API keys (masked)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;

  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check user has access to this app
  const hasAccess = await userHasAppAccess(session.user.id, appId);
  if (!hasAccess) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const app = await getApp(appId);
  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Mask keys for security (show only prefix and last 4 chars)
  const maskKey = (key: string) => {
    const prefix = key.substring(0, key.indexOf("_") + 1);
    const suffix = key.substring(key.length - 4);
    return `${prefix}...${suffix}`;
  };

  return NextResponse.json({
    publicKey: maskKey(app.publicKey),
    secretKey: maskKey(app.secretKey),
    publicKeyFull: app.publicKey, // For display in dashboard
  });
}

