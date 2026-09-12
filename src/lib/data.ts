import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  bookings,
  cinemas,
  genres,
  movies,
  seats,
  showtimeSeats,
  showtimes,
} from "@/db/schema";
import {
  fallbackCinemas,
  fallbackGenres,
  fallbackLanguages,
  fallbackMovies,
  fallbackShowtimeSeatMap,
} from "@/lib/fallback-data";

async function canReachDatabase() {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

export type MovieFilters = {
  title?: string;
  genre?: string;
  language?: string;
  cinemaId?: string;
  date?: string;
};

export async function getMovies(filters: MovieFilters) {
  if (!(await canReachDatabase())) {
    const title = filters.title?.toLowerCase() ?? "";
    const genre = filters.genre?.toLowerCase() ?? "";
    const language = filters.language?.toLowerCase() ?? "";

    return fallbackMovies.filter((movie) => {
      const matchesTitle = !title || movie.title.toLowerCase().includes(title);
      const matchesLanguage = !language || movie.language.toLowerCase() === language;
      const matchesGenre = !genre || movie.movieGenres.some((item) => item.genre.name.toLowerCase() === genre);
      return matchesTitle && matchesLanguage && matchesGenre;
    });
  }

  const whereParts = [eq(movies.isPublished, true)];

  if (filters.title) {
    whereParts.push(ilike(movies.title, `%${filters.title}%`));
  }
  if (filters.language) {
    whereParts.push(eq(movies.language, filters.language));
  }

  const genreFilter = filters.genre
    ? sql`EXISTS (
      SELECT 1
      FROM movie_genres mg
      JOIN genres g ON g.id = mg.genre_id
      WHERE mg.movie_id = ${movies.id} AND g.name = ${filters.genre}
    )`
    : undefined;

  const cinemaFilter = filters.cinemaId
    ? sql`EXISTS (
      SELECT 1
      FROM showtimes st
      JOIN auditoriums a ON a.id = st.auditorium_id
      WHERE st.movie_id = ${movies.id} AND a.cinema_id = ${filters.cinemaId}::uuid
    )`
    : undefined;

  const dateFilter = filters.date
    ? sql`EXISTS (
      SELECT 1
      FROM showtimes st
      WHERE st.movie_id = ${movies.id}
        AND DATE(st.starts_at AT TIME ZONE 'UTC') = ${filters.date}
    )`
    : undefined;

  return db.query.movies.findMany({
    where: and(...whereParts, genreFilter, cinemaFilter, dateFilter),
    orderBy: [asc(movies.title)],
    with: {
      movieGenres: {
        with: {
          genre: true,
        },
      },
    },
  });
}

export async function getMovieById(movieId: string) {
  if (!(await canReachDatabase())) {
    return fallbackMovies.find((movie) => movie.id === movieId) ?? null;
  }

  return db.query.movies.findFirst({
    where: eq(movies.id, movieId),
    with: {
      movieGenres: {
        with: { genre: true },
      },
      showtimes: {
        orderBy: [asc(showtimes.startsAt)],
        with: {
          auditorium: {
            with: {
              cinema: true,
            },
          },
        },
      },
    },
  });
}

export async function getCinemaById(cinemaId: string) {
  if (!(await canReachDatabase())) {
    return fallbackCinemas.find((cinema) => cinema.id === cinemaId) ?? null;
  }

  return db.query.cinemas.findFirst({
    where: eq(cinemas.id, cinemaId),
    with: {
      auditoriums: {
        with: {
          showtimes: {
            orderBy: [asc(showtimes.startsAt)],
            with: {
              movie: true,
            },
          },
        },
      },
    },
  });
}

export async function getFilterLists() {
  if (!(await canReachDatabase())) {
    return {
      genres: fallbackGenres,
      languages: fallbackLanguages,
      cinemas: fallbackCinemas,
    };
  }

  const [genreRows, languageRows, cinemaRows] = await Promise.all([
    db.select().from(genres).orderBy(asc(genres.name)),
    db.selectDistinct({ language: movies.language }).from(movies).orderBy(asc(movies.language)),
    db.select().from(cinemas).orderBy(asc(cinemas.name)),
  ]);

  return {
    genres: genreRows,
    languages: languageRows.map((row) => row.language),
    cinemas: cinemaRows,
  };
}

export async function getShowtimeSeatMap(showtimeId: string) {
  if (!(await canReachDatabase())) {
    return fallbackShowtimeSeatMap[showtimeId] ?? null;
  }

  const showtime = await db.query.showtimes.findFirst({
    where: eq(showtimes.id, showtimeId),
    with: {
      movie: true,
      auditorium: {
        with: {
          cinema: true,
        },
      },
    },
  });

  if (!showtime) return null;

  const map = await db
    .select({
      showtimeSeatId: showtimeSeats.id,
      status: showtimeSeats.status,
      holdExpiresAt: showtimeSeats.holdExpiresAt,
      priceMinor: showtimeSeats.priceMinor,
      seatId: seats.id,
      rowLabel: seats.rowLabel,
      seatNumber: seats.seatNumber,
      seatType: seats.seatType,
    })
    .from(showtimeSeats)
    .innerJoin(seats, eq(showtimeSeats.seatId, seats.id))
    .where(eq(showtimeSeats.showtimeId, showtimeId))
    .orderBy(asc(seats.rowLabel), asc(seats.seatNumber));

  return { showtime, seats: map };
}

export async function getBookingWithRelations(bookingId: string) {
  return db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: {
      user: true,
      showtime: {
        with: {
          movie: true,
          auditorium: {
            with: { cinema: true },
          },
        },
      },
      items: {
        with: {
          showtimeSeat: {
            with: {
              seat: true,
            },
          },
        },
      },
      ticket: true,
      payments: true,
    },
  });
}

export async function getBookingsForUser(userId: string) {
  if (!(await canReachDatabase())) {
    return [];
  }

  return db.query.bookings.findMany({
    where: eq(bookings.userId, userId),
    orderBy: [sql`${bookings.createdAt} desc`],
    with: {
      showtime: {
        with: {
          movie: true,
          auditorium: {
            with: { cinema: true },
          },
        },
      },
      payments: true,
      ticket: true,
    },
  });
}

export async function getAdminOverview() {
  const [movieCount] = await db.select({ count: sql<number>`count(*)` }).from(movies);
  const [bookingCount] = await db.select({ count: sql<number>`count(*)` }).from(bookings);
  const [confirmedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookings)
    .where(eq(bookings.status, "CONFIRMED"));

  return {
    movieCount: Number(movieCount?.count ?? 0),
    bookingCount: Number(bookingCount?.count ?? 0),
    confirmedCount: Number(confirmedCount?.count ?? 0),
  };
}
