import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/services/stripe";
import { isCloudMode } from "@/lib/config";
import { getUserOrganizations } from "@/lib/services/organizations";

const checkoutSchema = z.object({
  planId: z.enum(["starter", "growth", "scale"]),
  billingCycle: z.enum(["monthly", "yearly"]),
});

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

  // Parse request body
  const body = await request.json();
  const result = checkoutSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten() },
      { status: 400 }
    );
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
    const url = await createCheckoutSession({
      organizationId,
      planId: result.data.planId,
      billingCycle: result.data.billingCycle,
      successUrl: `${process.env.BETTER_AUTH_URL}/dashboard/settings?billing=success`,
      cancelUrl: `${process.env.BETTER_AUTH_URL}/dashboard/settings?billing=canceled`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

