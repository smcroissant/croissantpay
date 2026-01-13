import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { handleStripeWebhook } from "@/lib/services/stripe";
import { isCloudMode } from "@/lib/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  if (!isCloudMode()) {
    return NextResponse.json(
      { error: "Stripe webhooks only available in cloud mode" },
      { status: 400 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    await handleStripeWebhook(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error handling Stripe webhook:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

