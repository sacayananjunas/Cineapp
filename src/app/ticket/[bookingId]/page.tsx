import Image from "next/image";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { getBookingWithRelations } from "@/lib/data";

export default async function TicketPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { bookingId } = await params;
  const booking = await getBookingWithRelations(bookingId);

  if (!booking || booking.userId !== session.user.id) {
    redirect("/bookings");
  }

  if (booking.status !== "CONFIRMED") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Ticket is pending payment confirmation. Please refresh after payment completes.
        </div>
      </div>
    );
  }

  const ticket = booking.ticket[0];
  if (!ticket) {
    return <div className="mx-auto max-w-3xl px-4 py-8">Ticket was not generated yet.</div>;
  }

  const qrDataUrl = await QRCode.toDataURL(ticket.qrPayload);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl">Digital Ticket</h1>
        <p className="mt-2 text-sm text-slate-600">Reference: {booking.bookingReference}</p>
        <p className="text-sm text-slate-600">Ticket No: {ticket.ticketNumber}</p>
        <p className="mt-3 text-sm text-slate-700">
          {booking.showtime.movie.title} | {new Date(booking.showtime.startsAt).toLocaleString()}
        </p>
        <Image
          src={qrDataUrl}
          alt="Ticket QR"
          width={176}
          height={176}
          className="mt-5 h-44 w-44 rounded-lg border border-slate-200"
        />
      </section>
    </div>
  );
}
