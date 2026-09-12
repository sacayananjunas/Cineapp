import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBookingWithRelations } from "@/lib/data";
import { createCheckoutSession } from "@/lib/payments";
import { currencyFromMinor } from "@/lib/utils";

export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { bookingId } = await params;
  const booking = await getBookingWithRelations(bookingId);

  if (!booking || booking.userId !== session.user.id) {
    redirect("/bookings");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-slate-600">Booking reference: {booking.bookingReference}</p>

        <ul className="mt-5 space-y-2 text-sm">
          {booking.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>
                Seat {item.showtimeSeat.seat.rowLabel}{item.showtimeSeat.seat.seatNumber}
              </span>
              <span>{currencyFromMinor(item.priceMinor, booking.currency)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{currencyFromMinor(booking.subtotalMinor, booking.currency)}</span></div>
          <div className="mt-1 flex justify-between"><span>Service Fee</span><span>{currencyFromMinor(booking.serviceFeeMinor, booking.currency)}</span></div>
          <div className="mt-1 flex justify-between"><span>Tax</span><span>{currencyFromMinor(booking.taxMinor, booking.currency)}</span></div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
            <span>Total</span><span>{currencyFromMinor(booking.totalMinor, booking.currency)}</span>
          </div>
        </div>

        <form
          action={async () => {
            "use server";
            const url = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
            const stripeSession = await createCheckoutSession(booking.id, session.user.id, url);
            if (!stripeSession.url) throw new Error("Stripe session URL missing.");
            redirect(stripeSession.url);
          }}
        >
          <button type="submit" className="mt-6 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400">
            Pay in Test Mode
          </button>
        </form>
      </section>
    </div>
  );
}
