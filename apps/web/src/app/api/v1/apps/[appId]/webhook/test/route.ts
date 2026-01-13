import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { userHasAppAccess, getApp } from "@/lib/services/apps";
import { sendCustomerWebhook } from "@/lib/services/customer-webhooks";

// POST /api/v1/apps/:appId/webhook/test - Send a test webhook
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

  const app = await getApp(appId);
  if (!app || !app.webhookUrl) {
    return NextResponse.json(
      { error: "No webhook URL configured" },
      { status: 400 }
    );
  }

  // Send test webhook
  const result = await sendCustomerWebhook(appId, "subscriber.created", {
    subscriberId: "test_subscriber_123",
    appUserId: "test_user_123",
    isTest: true,
    message: "This is a test webhook from CroissantPay",
    timestamp: new Date().toISOString(),
  });

  if (!result) {
    return NextResponse.json(
      { error: "Failed to send webhook - no URL configured" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: result.success,
    statusCode: result.statusCode,
    duration: result.duration,
    error: result.error,
    responseBody: result.responseBody?.substring(0, 500), // Truncate response
  });
}

