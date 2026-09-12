import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createPendingBooking } from "@/lib/booking";
import { getShowtimeSeatMap } from "@/lib/data";
import { currencyFromMinor } from "@/lib/utils";

export default async function ShowtimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seatMap = await getShowtimeSeatMap(id);

  if (!seatMap) {
    return <div className="mx-auto max-w-3xl px-4 py-8">Showtime not found.</div>;
  }

  const onHoldSeats = seatMap.seats.filter((seat) => seat.status === "HELD").length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl">{seatMap.showtime.movie.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {seatMap.showtime.auditorium.cinema.name} - {seatMap.showtime.auditorium.name} | {new Date(
            seatMap.showtime.startsAt
          ).toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-slate-500">Live status updates include currently held seats ({onHoldSeats}).</p>
      </section>

      <form
        action={async (formData) => {
          "use server";
          const session = await auth();
          if (!session?.user) {
            redirect("/login");
          }

          const selected = formData.getAll("seat").map(String);
          if (selected.length === 0) {
            return;
          }

          const booking = await createPendingBooking({
            userId: session.user.id,
            showtimeId: id,
            showtimeSeatIds: selected,
            idempotencyKey: randomUUID(),
          });

          redirect(`/checkout/${booking.id}`);
        }}
      >
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl">Select seats</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-8">
            {seatMap.seats.map((seat) => {
              const disabled = seat.status === "BOOKED" || seat.status === "BLOCKED";
              const held = seat.status === "HELD";
              return (
                <label
                  key={seat.showtimeSeatId}
                  className={`rounded-lg border p-2 text-xs ${
                    disabled
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : held
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="seat"
                    value={seat.showtimeSeatId}
                    disabled={disabled || held}
                    className="mr-1"
                  />
                  {seat.rowLabel}{seat.seatNumber} ({currencyFromMinor(seat.priceMinor)})
                </label>
              );
            })}
          </div>
          <button type="submit" className="mt-6 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Continue to Checkout
          </button>
        </section>
      </form>
    </div>
  );
}
