import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createBillingPortalSession } from "@/lib/services/stripe";
import { isCloudMode } from "@/lib/config";
import { getUserOrganizations } from "@/lib/services/organizations";

export async function POST(request: NextRequest) {
  if (!isCloudMode()) {
    return NextResponse.json(
      { error: "Billing only available in cloud mode" },
      { status: 400 }
    );
  }

  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's organization
  const organizations = await getUserOrganizations(session.user.id);
  if (organizations.length === 0) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 400 }
    );
  }

  const organizationId = organizations[0].id;

  try {
    const url = await createBillingPortalSession(
      organizationId,
      `${process.env.BETTER_AUTH_URL}/dashboard/settings`
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}

