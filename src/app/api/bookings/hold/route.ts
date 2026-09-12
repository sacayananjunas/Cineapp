import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPendingBooking } from "@/lib/booking";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { showtimeId: string; showtimeSeatIds: string[]; idempotencyKey?: string };

  if (!body.showtimeId || !Array.isArray(body.showtimeSeatIds) || body.showtimeSeatIds.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const booking = await createPendingBooking({
      userId: session.user.id,
      showtimeId: body.showtimeId,
      showtimeSeatIds: body.showtimeSeatIds,
      idempotencyKey: body.idempotencyKey ?? randomUUID(),
    });

    return NextResponse.json({ bookingId: booking.id, bookingReference: booking.bookingReference });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 409 }
    );
  }
}
