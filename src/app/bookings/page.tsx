import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { cancelBooking } from "@/lib/booking";
import { getBookingsForUser } from "@/lib/data";
import { currencyFromMinor } from "@/lib/utils";

export default async function BookingHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bookingRows = await getBookingsForUser(session.user.id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl">Booking History</h1>
      <div className="mt-5 space-y-3">
        {bookingRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No bookings yet.</div>
        ) : (
          bookingRows.map((booking) => (
            <article key={booking.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-semibold text-slate-900">{booking.showtime.movie.title}</p>
              <p className="text-xs text-slate-600">{new Date(booking.showtime.startsAt).toLocaleString()} | {booking.showtime.auditorium.cinema.name}</p>
              <p className="mt-2 text-sm">Status: <span className="font-semibold">{booking.status}</span> | Payment: <span className="font-semibold">{booking.payments[0]?.status ?? "N/A"}</span></p>
              <p className="text-sm">Total: {currencyFromMinor(booking.totalMinor, booking.currency)}</p>
              <div className="mt-3 flex gap-3">
                {booking.ticket[0] ? <a href={`/ticket/${booking.id}`} className="text-sm text-amber-700 hover:text-amber-800">View ticket</a> : null}
                {booking.status === "CONFIRMED" ? (
                  <form
                    action={async () => {
                      "use server";
                      await cancelBooking(booking.id, session.user.id);
                    }}
                  >
                    <button type="submit" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100">
                      Cancel booking
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
