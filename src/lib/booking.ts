import { randomUUID } from "crypto";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  bookingItems,
  bookings,
  payments,
  showtimeSeats,
  tickets,
} from "@/db/schema";
import { log } from "@/lib/logger";
import { calculatePricing, makeBookingReference, makeTicketNumber } from "@/lib/utils";

const HOLD_MINUTES = 10;

export type HoldInput = {
  userId: string;
  showtimeId: string;
  showtimeSeatIds: string[];
  idempotencyKey: string;
};

export async function createPendingBooking(input: HoldInput) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.bookings.findFirst({
      where: eq(bookings.idempotencyKey, input.idempotencyKey),
      with: { items: true },
    });
    if (existing) {
      return existing;
    }

    await tx.execute(sql`SELECT id FROM showtime_seats WHERE id IN (${sql.join(
      input.showtimeSeatIds.map((id) => sql`${id}::uuid`),
      sql`, `
    )}) FOR UPDATE`);

    const now = new Date();
    const lockedSeats = await tx
      .select()
      .from(showtimeSeats)
      .where(
        and(
          eq(showtimeSeats.showtimeId, input.showtimeId),
          inArray(showtimeSeats.id, input.showtimeSeatIds)
        )
      );

    if (lockedSeats.length !== input.showtimeSeatIds.length) {
      throw new Error("Some selected seats do not exist for this showtime.");
    }

    const unavailable = lockedSeats.find((seat) => {
      if (seat.status === "AVAILABLE") return false;
      if (seat.status === "HELD" && seat.holdExpiresAt && seat.holdExpiresAt < now) {
        return false;
      }
      return true;
    });

    if (unavailable) {
      throw new Error("One or more seats are no longer available.");
    }

    const holdExpiresAt = new Date(now.getTime() + HOLD_MINUTES * 60_000);
    const subtotalMinor = lockedSeats.reduce((sum, seat) => sum + seat.priceMinor, 0);
    const { serviceFeeMinor, taxMinor, totalMinor } = calculatePricing(subtotalMinor);

    await tx
      .update(showtimeSeats)
      .set({
        status: "HELD",
        heldByUserId: input.userId,
        holdExpiresAt,
        updatedAt: now,
      })
      .where(inArray(showtimeSeats.id, input.showtimeSeatIds));

    const [booking] = await tx
      .insert(bookings)
      .values({
        userId: input.userId,
        showtimeId: input.showtimeId,
        bookingReference: makeBookingReference(),
        idempotencyKey: input.idempotencyKey,
        status: "PENDING",
        subtotalMinor,
        serviceFeeMinor,
        taxMinor,
        totalMinor,
        holdExpiresAt,
      })
      .returning();

    await tx.insert(bookingItems).values(
      lockedSeats.map((seat) => ({
        bookingId: booking.id,
        showtimeSeatId: seat.id,
        priceMinor: seat.priceMinor,
      }))
    );

    await tx.insert(payments).values({
      bookingId: booking.id,
      provider: "stripe",
      status: "PENDING",
      amountMinor: totalMinor,
      currency: booking.currency,
      webhookIdempotencyKey: randomUUID(),
    });

    return booking;
  });
}

export async function releaseExpiredSeatHolds() {
  const now = new Date();

  const expired = await db
    .select({ id: showtimeSeats.id })
    .from(showtimeSeats)
    .where(
      and(
        eq(showtimeSeats.status, "HELD"),
        lt(showtimeSeats.holdExpiresAt, now)
      )
    );

  if (expired.length === 0) {
    return { releasedSeats: 0, expiredBookings: 0 };
  }

  await db
    .update(showtimeSeats)
    .set({ status: "AVAILABLE", holdExpiresAt: null, heldByUserId: null, updatedAt: now })
    .where(inArray(showtimeSeats.id, expired.map((seat) => seat.id)));

  const pendingBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.status, "PENDING"), lt(bookings.holdExpiresAt, now)));

  if (pendingBookings.length > 0) {
    await db
      .update(bookings)
      .set({ status: "EXPIRED", updatedAt: now })
      .where(inArray(bookings.id, pendingBookings.map((booking) => booking.id)));

    await db
      .update(payments)
      .set({ status: "CANCELLED", updatedAt: now })
      .where(
        and(
          inArray(
            payments.bookingId,
            pendingBookings.map((booking) => booking.id)
          ),
          eq(payments.status, "PENDING")
        )
      );
  }

  return { releasedSeats: expired.length, expiredBookings: pendingBookings.length };
}

export async function confirmBookingPayment(params: {
  providerSessionId: string;
  providerPaymentId?: string;
  webhookIdempotencyKey: string;
}) {
  await db.transaction(async (tx) => {
    const payment = await tx.query.payments.findFirst({
      where: eq(payments.providerSessionId, params.providerSessionId),
    });

    if (!payment) {
      throw new Error("Payment not found.");
    }

    if (payment.status === "SUCCEEDED") {
      return;
    }

    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId));

    if (!booking) {
      throw new Error("Booking not found.");
    }

    const items = await tx
      .select()
      .from(bookingItems)
      .where(eq(bookingItems.bookingId, booking.id));

    await tx
      .update(showtimeSeats)
      .set({ status: "BOOKED", holdExpiresAt: null, updatedAt: new Date() })
      .where(inArray(showtimeSeats.id, items.map((item) => item.showtimeSeatId)));

    await tx
      .update(payments)
      .set({
        status: "SUCCEEDED",
        providerPaymentId: params.providerPaymentId ?? payment.providerPaymentId,
        webhookIdempotencyKey: params.webhookIdempotencyKey,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    await tx
      .update(bookings)
      .set({ status: "CONFIRMED", updatedAt: new Date() })
      .where(eq(bookings.id, booking.id));

    const existingTicket = await tx.query.tickets.findFirst({
      where: eq(tickets.bookingId, booking.id),
    });

    if (!existingTicket) {
      await tx.insert(tickets).values({
        bookingId: booking.id,
        ticketNumber: makeTicketNumber(),
        qrPayload: JSON.stringify({ bookingId: booking.id, reference: booking.bookingReference }),
      });
    }

    log("info", "Booking confirmed", { bookingId: booking.id, paymentId: payment.id });
  });
}

export async function cancelBooking(bookingId: string, userId: string) {
  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.id, bookingId), eq(bookings.userId, userId)),
    with: { showtime: true, items: true },
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (booking.status !== "CONFIRMED") {
    throw new Error("Only confirmed bookings can be cancelled.");
  }

  const cancellationCutoff = new Date(booking.showtime.startsAt.getTime() - 60 * 60_000);
  if (new Date() > cancellationCutoff) {
    throw new Error("This booking is no longer eligible for cancellation.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({ status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(bookings.id, booking.id));

    await tx
      .update(payments)
      .set({ status: "REFUNDED", updatedAt: new Date() })
      .where(eq(payments.bookingId, booking.id));

    await tx
      .update(showtimeSeats)
      .set({ status: "AVAILABLE", holdExpiresAt: null, heldByUserId: null, updatedAt: new Date() })
      .where(
        inArray(
          showtimeSeats.id,
          booking.items.map((item) => item.showtimeSeatId)
        )
      );
  });
}

export async function markPaymentFailed(providerSessionId: string) {
  await db.transaction(async (tx) => {
    const payment = await tx.query.payments.findFirst({
      where: eq(payments.providerSessionId, providerSessionId),
    });
    if (!payment) return;

    await tx
      .update(payments)
      .set({ status: "FAILED", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    await tx
      .update(bookings)
      .set({ status: "EXPIRED", updatedAt: new Date() })
      .where(eq(bookings.id, payment.bookingId));

    const bookingSeatItems = await tx
      .select()
      .from(bookingItems)
      .where(eq(bookingItems.bookingId, payment.bookingId));

    await tx
      .update(showtimeSeats)
      .set({ status: "AVAILABLE", holdExpiresAt: null, heldByUserId: null, updatedAt: new Date() })
      .where(inArray(showtimeSeats.id, bookingSeatItems.map((item) => item.showtimeSeatId)));
  });
}
