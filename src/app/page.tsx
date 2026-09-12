import Link from "next/link";
import { getFilterLists, getMovies } from "@/lib/data";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    title: typeof params.title === "string" ? params.title : undefined,
    genre: typeof params.genre === "string" ? params.genre : undefined,
    language: typeof params.language === "string" ? params.language : undefined,
    cinemaId: typeof params.cinemaId === "string" ? params.cinemaId : undefined,
    date: typeof params.date === "string" ? params.date : undefined,
  };

  let movies: Awaited<ReturnType<typeof getMovies>> = [];
  let lists: Awaited<ReturnType<typeof getFilterLists>> = {
    genres: [] as Array<{ id: string; name: string }>,
    languages: [] as string[],
    cinemas: [] as Array<{ id: string; name: string }> ,
  };
  [movies, lists] = await Promise.all([getMovies(filters), getFilterLists()]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <section className="rounded-3xl border border-amber-200/70 bg-white/90 p-6 shadow-sm">
        <h1 className="text-4xl leading-tight text-slate-900">Book tonight&apos;s best screenings</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Live availability, secure checkout, and instant digital tickets.
        </p>
        <form className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            name="title"
            defaultValue={filters.title}
            placeholder="Movie title"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm lg:col-span-2"
          />
          <select
            name="genre"
            defaultValue={filters.genre}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All genres</option>
            {lists.genres.map((genre) => (
              <option key={genre.id} value={genre.name}>
                {genre.name}
              </option>
            ))}
          </select>
          <select
            name="language"
            defaultValue={filters.language}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All languages</option>
            {lists.languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
          <select
            name="cinemaId"
            defaultValue={filters.cinemaId}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All cinemas</option>
            {lists.cinemas.map((cinema) => (
              <option key={cinema.id} value={cinema.id}>
                {cinema.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            defaultValue={filters.date}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 lg:col-span-6"
          >
            Search Showtimes
          </button>
        </form>
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {movies.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No movies matched your filters.
          </div>
        ) : (
          movies.map((movie) => (
            <article key={movie.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                {movie.language}
              </div>
              <h2 className="mt-2 text-2xl">{movie.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{movie.synopsis}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {movie.movieGenres.map((g) => (
                  <span key={g.genreId} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {g.genre.name}
                  </span>
                ))}
              </div>
              <Link
                href={`/movies/${movie.id}`}
                className="mt-5 inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                View Showtimes
              </Link>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
