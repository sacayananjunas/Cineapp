import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovieById } from "@/lib/data";
import { currencyFromMinor } from "@/lib/utils";

export default async function MovieDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await getMovieById(id);

  if (!movie) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-4xl text-slate-900">{movie.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{movie.synopsis}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {movie.movieGenres.map((g) => (
            <span key={g.genreId} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
              {g.genre.name}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl">Showtimes</h2>
        <div className="mt-4 space-y-3">
          {movie.showtimes.length === 0 ? (
            <p className="text-sm text-slate-600">No showtimes available yet.</p>
          ) : (
            movie.showtimes.map((showtime) => (
              <div key={showtime.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    {showtime.auditorium.cinema.name} - {showtime.auditorium.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {new Date(showtime.startsAt).toLocaleString()} | From {currencyFromMinor(showtime.basePriceMinor)}
                  </p>
                  <Link href={`/cinemas/${showtime.auditorium.cinema.id}`} className="text-xs text-amber-700 hover:text-amber-800">
                    View cinema
                  </Link>
                </div>
                <Link href={`/showtimes/${showtime.id}`} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                  Select Seats
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
