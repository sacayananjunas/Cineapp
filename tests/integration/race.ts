import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/client";
import { createPendingBooking } from "../../src/lib/booking";
import { showtimeSeats, users } from "../../src/db/schema";

async function ensureUser(email: string, name: string) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash: randomUUID(),
      role: "USER",
    })
    .returning();

  return created;
}

async function main() {
  const seat = await db.query.showtimeSeats.findFirst({
    where: eq(showtimeSeats.status, "AVAILABLE"),
    with: { showtime: true },
  });

  if (!seat) {
    throw new Error("No available showtime seat found. Run seed first.");
  }

  const userA = await ensureUser("race-a@cinebook.dev", "Race User A");
  const userB = await ensureUser("race-b@cinebook.dev", "Race User B");

  const p1 = createPendingBooking({
    userId: userA.id,
    showtimeId: seat.showtimeId,
    showtimeSeatIds: [seat.id],
    idempotencyKey: randomUUID(),
  });

  const p2 = createPendingBooking({
    userId: userB.id,
    showtimeId: seat.showtimeId,
    showtimeSeatIds: [seat.id],
    idempotencyKey: randomUUID(),
  });

  const [r1, r2] = await Promise.allSettled([p1, p2]);
  const ok = [r1, r2].filter((r) => r.status === "fulfilled").length;
  const failed = [r1, r2].filter((r) => r.status === "rejected").length;

  if (ok !== 1 || failed !== 1) {
    console.error({ r1, r2 });
    throw new Error(`Expected exactly one success and one failure, got success=${ok}, failure=${failed}`);
  }

  const latestSeat = await db.query.showtimeSeats.findFirst({ where: eq(showtimeSeats.id, seat.id) });
  if (!latestSeat || latestSeat.status !== "HELD") {
    throw new Error("Seat status did not transition to HELD as expected.");
  }

  console.log("Race test passed: one booking won the lock, one was rejected.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
