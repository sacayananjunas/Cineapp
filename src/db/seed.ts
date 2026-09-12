import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  auditoriums,
  cinemas,
  genres,
  movieGenres,
  movies,
  seats,
  showtimeSeats,
  showtimes,
  users,
} from "@/db/schema";

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60_000);
}

async function seed() {
  const adminPassword = await hash("Admin123!", 10);
  const userPassword = await hash("User123!", 10);

  const [admin] = await db
    .insert(users)
    .values({
      name: "CineBook Admin",
      email: "admin@cinebook.dev",
      passwordHash: adminPassword,
      role: "ADMIN",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: "CineBook Admin", passwordHash: adminPassword, role: "ADMIN" },
    })
    .returning();

  await db.insert(users).values({
    name: "CineBook User",
    email: "user@cinebook.dev",
    passwordHash: userPassword,
    role: "USER",
  }).onConflictDoNothing();

  const genreRows = await db
    .insert(genres)
    .values([{ name: "Action" }, { name: "Drama" }, { name: "Sci-Fi" }, { name: "Family" }])
    .onConflictDoNothing()
    .returning();

  const allGenres = genreRows.length > 0 ? genreRows : await db.select().from(genres);
  const genreMap = new Map(allGenres.map((genre) => [genre.name, genre.id]));

  const movieRows = await db
    .insert(movies)
    .values([
      {
        title: "Solar Drift",
        synopsis: "A rescue crew races through deep space to retrieve a missing research vessel.",
        language: "English",
        durationMinutes: 126,
        posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba",
        isPublished: true,
      },
      {
        title: "Monsoon Letters",
        synopsis: "Two strangers reconnect through letters that arrive decades late.",
        language: "Hindi",
        durationMinutes: 112,
        posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
        isPublished: true,
      },
      {
        title: "Neon Valley",
        synopsis: "A family adventure through a city powered by kinetic light.",
        language: "English",
        durationMinutes: 104,
        posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1",
        isPublished: true,
      },
    ])
    .onConflictDoNothing()
    .returning();

  const allMovies = movieRows.length > 0 ? movieRows : await db.select().from(movies);

  const byTitle = new Map(allMovies.map((movie) => [movie.title, movie.id]));
  const joins = [
    ["Solar Drift", "Sci-Fi"],
    ["Solar Drift", "Action"],
    ["Monsoon Letters", "Drama"],
    ["Neon Valley", "Family"],
  ] as const;

  for (const [title, genre] of joins) {
    const movieId = byTitle.get(title);
    const genreId = genreMap.get(genre);
    if (!movieId || !genreId) continue;
    await db.insert(movieGenres).values({ movieId, genreId }).onConflictDoNothing();
  }

  const cinemaRows = await db
    .insert(cinemas)
    .values([
      {
        name: "CineBook Downtown",
        city: "Seattle",
        address: "455 Pine Street, Seattle",
      },
      {
        name: "CineBook Harbor",
        city: "Seattle",
        address: "90 Harbor Ave, Seattle",
      },
    ])
    .onConflictDoNothing()
    .returning();

  const allCinemas = cinemaRows.length > 0 ? cinemaRows : await db.select().from(cinemas);
  const downtown = allCinemas.find((c) => c.name === "CineBook Downtown");
  const harbor = allCinemas.find((c) => c.name === "CineBook Harbor");

  if (!downtown || !harbor) {
    throw new Error("Failed to resolve cinemas.");
  }

  const auditoriumRows = await db
    .insert(auditoriums)
    .values([
      { cinemaId: downtown.id, name: "Screen 1", seatRows: 6, seatColumns: 8 },
      { cinemaId: downtown.id, name: "Screen 2", seatRows: 5, seatColumns: 7 },
      { cinemaId: harbor.id, name: "Screen A", seatRows: 6, seatColumns: 9 },
    ])
    .onConflictDoNothing()
    .returning();

  const allAuditoriums =
    auditoriumRows.length > 0 ? auditoriumRows : await db.select().from(auditoriums);

  const existingSeats = await db.select().from(seats);
  if (existingSeats.length === 0) {
    for (const auditorium of allAuditoriums) {
      const seatData: Array<{
        auditoriumId: string;
        rowLabel: string;
        seatNumber: number;
        seatType: string;
      }> = [];

      for (let row = 0; row < auditorium.seatRows; row++) {
        const rowLabel = String.fromCharCode(65 + row);
        for (let col = 1; col <= auditorium.seatColumns; col++) {
          seatData.push({
            auditoriumId: auditorium.id,
            rowLabel,
            seatNumber: col,
            seatType: row < 2 ? "PREMIUM" : "STANDARD",
          });
        }
      }
      await db.insert(seats).values(seatData);
    }
  }

  const now = new Date();
  const startTimes = [addHours(now, 4), addHours(now, 7), addHours(now, 28), addHours(now, 31)];

  const showtimeSeed = [
    {
      movieId: byTitle.get("Solar Drift")!,
      auditoriumId: allAuditoriums[0].id,
      startsAt: startTimes[0],
      endsAt: addHours(startTimes[0], 2.1),
      basePriceMinor: 1850,
      currency: "USD",
    },
    {
      movieId: byTitle.get("Monsoon Letters")!,
      auditoriumId: allAuditoriums[1].id,
      startsAt: startTimes[1],
      endsAt: addHours(startTimes[1], 1.9),
      basePriceMinor: 1600,
      currency: "USD",
    },
    {
      movieId: byTitle.get("Neon Valley")!,
      auditoriumId: allAuditoriums[2].id,
      startsAt: startTimes[2],
      endsAt: addHours(startTimes[2], 1.8),
      basePriceMinor: 1450,
      currency: "USD",
    },
  ];

  const existingShowtimes = await db.select().from(showtimes);
  let actualShowtimes = existingShowtimes;
  if (existingShowtimes.length === 0) {
    actualShowtimes = await db.insert(showtimes).values(showtimeSeed).returning();
  }

  const existingShowtimeSeats = await db.select().from(showtimeSeats);
  if (existingShowtimeSeats.length === 0) {
    for (const showtime of actualShowtimes) {
      const seatRows = await db
        .select()
        .from(seats)
        .where(eq(seats.auditoriumId, showtime.auditoriumId));
      await db.insert(showtimeSeats).values(
        seatRows.map((seat) => ({
          showtimeId: showtime.id,
          seatId: seat.id,
          status: "AVAILABLE" as const,
          priceMinor: seat.seatType === "PREMIUM" ? showtime.basePriceMinor + 400 : showtime.basePriceMinor,
        }))
      );
    }
  }

  console.log("Seed complete", { adminEmail: admin.email, userEmail: "user@cinebook.dev" });
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
