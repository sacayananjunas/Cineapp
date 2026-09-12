import Link from "next/link";
import { notFound } from "next/navigation";
import { getCinemaById } from "@/lib/data";

export default async function CinemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cinema = await getCinemaById(id);

  if (!cinema) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl">{cinema.name}</h1>
        <p className="mt-2 text-sm text-slate-600">{cinema.address}, {cinema.city}</p>
      </section>

      <section className="mt-6 space-y-4">
        {cinema.auditoriums.map((auditorium) => (
          <div key={auditorium.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl">{auditorium.name}</h2>
            <p className="text-xs text-slate-500">{auditorium.seatRows} rows x {auditorium.seatColumns} seats</p>
            <div className="mt-3 space-y-2">
              {auditorium.showtimes.length === 0 ? (
                <p className="text-sm text-slate-600">No showtimes scheduled.</p>
              ) : (
                auditorium.showtimes.map((showtime) => (
                  <div key={showtime.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="font-medium text-slate-900">{showtime.movie.title}</p>
                      <p className="text-xs text-slate-600">{new Date(showtime.startsAt).toLocaleString()}</p>
                    </div>
                    <Link href={`/showtimes/${showtime.id}`} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
                      Book seats
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
