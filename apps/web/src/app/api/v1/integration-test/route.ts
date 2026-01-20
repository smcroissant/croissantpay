import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { app } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/v1/integration-test
 * 
 * Called by the SDK to verify the integration is working correctly.
 * Records the test timestamp and metadata in the database.
 * 
 * Headers:
 *   - Authorization: Bearer <public_key>
 * 
 * Body:
 *   - platform: "ios" | "android" | "web" (optional)
 *   - sdkVersion: string (optional)
 *   - appUserId: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing or invalid Authorization header",
          message: "Include your API key as: Authorization: Bearer <your_public_key>"
        },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();
    
    // Find the app by public key
    const [appRecord] = await db
      .select()
      .from(app)
      .where(eq(app.publicKey, apiKey))
      .limit(1);

    if (!appRecord) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid API key",
          message: "The provided API key does not match any app. Check your CroissantPay dashboard for the correct key."
        },
        { status: 401 }
      );
    }

    // Parse request body
    let body: { platform?: string; sdkVersion?: string; appUserId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const { platform, sdkVersion, appUserId } = body;

    // Update the app with the integration test timestamp
    const now = new Date();
    await db
      .update(app)
      .set({
        lastIntegrationTest: now,
        lastIntegrationTestPlatform: platform || "unknown",
        lastIntegrationTestVersion: sdkVersion || "unknown",
        updatedAt: now,
      })
      .where(eq(app.id, appRecord.id));

    return NextResponse.json({
      success: true,
      message: "🎉 Integration test successful! CroissantPay SDK is properly configured.",
      appId: appRecord.id,
      appName: appRecord.name,
      timestamp: now.toISOString(),
      details: {
        platform: platform || "unknown",
        sdkVersion: sdkVersion || "unknown",
        appUserId: appUserId || null,
      },
    });
  } catch (error) {
    console.error("Integration test error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/integration-test
 * 
 * Returns the current integration test status for an app.
 * Useful for the dashboard to check if a test has been received.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();
    
    const [appRecord] = await db
      .select()
      .from(app)
      .where(eq(app.publicKey, apiKey))
      .limit(1);

    if (!appRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      lastIntegrationTest: appRecord.lastIntegrationTest?.toISOString() || null,
      lastIntegrationTestPlatform: appRecord.lastIntegrationTestPlatform || null,
      lastIntegrationTestVersion: appRecord.lastIntegrationTestVersion || null,
    });
  } catch (error) {
    console.error("Integration test status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
