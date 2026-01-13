import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createApp } from "@/lib/services/apps";
import { getUserOrganizations, createOrganization } from "@/lib/services/organizations";

const createAppSchema = z.object({
  name: z.string().min(1, "App name is required"),
  bundleId: z.string().optional(),
  packageName: z.string().optional(),
});

// POST /api/dashboard/apps - Create a new app (dashboard auth)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's organization or create one
    let organizations = await getUserOrganizations(session.user.id);
    
    if (organizations.length === 0) {
      // Auto-create a default organization for the user
      const userSlug = session.user.email?.split("@")[0] || `user-${session.user.id.slice(0, 8)}`;
      const newOrg = await createOrganization({
        name: `${session.user.name || userSlug}'s Organization`,
        slug: userSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        ownerId: session.user.id,
      });
      organizations = [{ ...newOrg, role: "owner" }];
    }

    const organizationId = organizations[0].id;

    // Parse request body
    const body = await request.json();
    const result = createAppSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Create the app
    const newApp = await createApp({
      organizationId,
      name: result.data.name,
      bundleId: result.data.bundleId,
      packageName: result.data.packageName,
    });

    return NextResponse.json(
      {
        app: {
          id: newApp.id,
          name: newApp.name,
          bundleId: newApp.bundleId,
          packageName: newApp.packageName,
          publicKey: newApp.publicKey,
          secretKey: newApp.secretKey,
          createdAt: newApp.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating app:", error);
    return NextResponse.json(
      { error: "Failed to create app" },
      { status: 500 }
    );
  }
}

// GET /api/dashboard/apps - List all apps for the user's organization
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's organization
    const organizations = await getUserOrganizations(session.user.id);
    
    if (organizations.length === 0) {
      // No organization yet, return empty apps list
      return NextResponse.json({ apps: [] });
    }

    const organizationId = organizations[0].id;

    // Import here to avoid circular dependency
    const { getAppsByOrganization } = await import("@/lib/services/apps");
    const apps = await getAppsByOrganization(organizationId);

    return NextResponse.json({ apps });
  } catch (error) {
    console.error("Error fetching apps:", error);
    return NextResponse.json(
      { error: "Failed to fetch apps" },
      { status: 500 }
    );
  }
}

