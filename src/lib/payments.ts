import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, payments } from "@/db/schema";
import { env } from "@/lib/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-08-26.dahlia",
});

export async function createCheckoutSession(bookingId: string, userId: string, baseUrl: string) {
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (booking.userId !== userId) {
    throw new Error("Unauthorized booking access.");
  }

  if (booking.status !== "PENDING") {
    throw new Error("Only pending bookings can be paid.");
  }

  if (booking.holdExpiresAt < new Date()) {
    throw new Error("Seat hold expired. Please choose seats again.");
  }

  const payment = await db.query.payments.findFirst({
    where: and(eq(payments.bookingId, booking.id), eq(payments.provider, "stripe")),
  });

  if (!payment) {
    throw new Error("Payment record not found for booking.");
  }

  if (payment.providerSessionId) {
    const existingSession = await stripe.checkout.sessions.retrieve(payment.providerSessionId);
    return existingSession;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${baseUrl}/ticket/${booking.id}`,
    cancel_url: `${baseUrl}/checkout/${booking.id}?status=cancelled`,
    metadata: {
      bookingId: booking.id,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: booking.currency.toLowerCase(),
          product_data: {
            name: `CineBook Booking ${booking.bookingReference}`,
          },
          unit_amount: booking.totalMinor,
        },
      },
    ],
  }, { idempotencyKey: `checkout-${booking.idempotencyKey}` });

  await db
    .update(payments)
    .set({ providerSessionId: session.id, updatedAt: new Date() })
    .where(eq(payments.bookingId, booking.id));

  return session;
}
