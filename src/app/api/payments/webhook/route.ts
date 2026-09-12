import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { confirmBookingPayment, markPaymentFailed } from "@/lib/booking";
import { env } from "@/lib/env";
import { stripe } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await confirmBookingPayment({
      providerSessionId: session.id,
      providerPaymentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
      webhookIdempotencyKey: event.id,
    });
  }

  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;
    await markPaymentFailed(session.id);
  }

  if (event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    await confirmBookingPayment({
      providerSessionId: session.id,
      providerPaymentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
      webhookIdempotencyKey: event.id,
    });
  }

  return NextResponse.json({ received: true });
}
