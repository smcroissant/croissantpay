import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  userHasAppAccess,
  getApp,
  configureWebhook,
  updateApp,
} from "@/lib/services/apps";
import { generateWebhookSecret } from "@/lib/services/customer-webhooks";

const webhookSchema = z.object({
  webhookUrl: z.string().url().or(z.literal("")),
});

// POST /api/v1/apps/:appId/webhook - Configure customer webhook
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
  const result = webhookSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { webhookUrl } = result.data;

  if (webhookUrl === "") {
    // Remove webhook configuration
    await updateApp(appId, { webhookUrl: undefined });
    return NextResponse.json({
      success: true,
      message: "Webhook disabled",
    });
  }

  // Configure webhook with new secret
  const webhookSecret = await configureWebhook(appId, webhookUrl);

  return NextResponse.json({
    success: true,
    message: "Webhook configured successfully",
    webhookUrl,
    webhookSecret,
  });
}

// GET /api/v1/apps/:appId/webhook - Get webhook configuration
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

  return NextResponse.json({
    webhookUrl: app.webhookUrl,
    hasWebhookSecret: !!app.webhookSecret,
    // Don't expose the secret directly
  });
}

// PUT /api/v1/apps/:appId/webhook - Rotate webhook secret
export async function PUT(
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
  if (!app || !app.webhookUrl) {
    return NextResponse.json(
      { error: "No webhook configured" },
      { status: 400 }
    );
  }

  // Generate new secret
  const webhookSecret = await configureWebhook(appId, app.webhookUrl);

  return NextResponse.json({
    success: true,
    message: "Webhook secret rotated",
    webhookSecret,
  });
}

