import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getApp, updateApp } from "@/lib/services/apps";
import { userHasAppAccess } from "@/lib/services/apps";

const updateAppSchema = z.object({
  name: z.string().min(1).optional(),
  bundleId: z.string().nullable().optional(),
  packageName: z.string().nullable().optional(),
  appleTeamId: z.string().nullable().optional(),
  appleKeyId: z.string().nullable().optional(),
  appleIssuerId: z.string().nullable().optional(),
  applePrivateKey: z.string().nullable().optional(),
  appleSharedSecret: z.string().nullable().optional(),
  googleServiceAccount: z.string().nullable().optional(),
  webhookUrl: z.string().url().nullable().optional(),
});

// GET /api/dashboard/apps/[appId] - Get app details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
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

    return NextResponse.json({ app });
  } catch (error) {
    console.error("Error fetching app:", error);
    return NextResponse.json(
      { error: "Failed to fetch app" },
      { status: 500 }
    );
  }
}

// PATCH /api/dashboard/apps/[appId] - Update app
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
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

    // Parse and validate body
    const body = await request.json();
    const result = updateAppSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Filter out undefined values and only include actual updates
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(result.data)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    const updatedApp = await updateApp(appId, updates);

    return NextResponse.json({ app: updatedApp });
  } catch (error) {
    console.error("Error updating app:", error);
    return NextResponse.json(
      { error: "Failed to update app" },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/apps/[appId] - Delete app
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
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

    const { deleteApp } = await import("@/lib/services/apps");
    await deleteApp(appId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting app:", error);
    return NextResponse.json(
      { error: "Failed to delete app" },
      { status: 500 }
    );
  }
}

